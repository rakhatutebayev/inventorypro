import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { assetsService } from '../services/assets';
import { LocationType } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export default function Inventory() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [scanNumber, setScanNumber] = useState('');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [sessionDescription, setSessionDescription] = useState('');

  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['inventory-sessions'],
    queryFn: () => inventoryService.getSessions(),
  });

  // Fetch current session
  const { data: currentSession } = useQuery({
    queryKey: ['inventory-session', currentSessionId],
    queryFn: () => inventoryService.getSession(currentSessionId!),
    enabled: !!currentSessionId,
  });

  // Fetch session results
  const { data: results = [] } = useQuery({
    queryKey: ['inventory-results', currentSessionId],
    queryFn: () => inventoryService.getResults(currentSessionId!),
    enabled: !!currentSessionId,
  });

  // Scan asset
  const { data: scannedAsset, refetch: scanAsset } = useQuery({
    queryKey: ['scan-asset', scanNumber],
    queryFn: () => assetsService.scan(scanNumber),
    enabled: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: { description?: string }) => inventoryService.createSession(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      setCurrentSessionId(session.id);
      setIsNewSessionModalOpen(false);
      setSessionDescription('');
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: (sessionId: number) => inventoryService.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-session', currentSessionId] });
      setCurrentSessionId(null);
    },
  });

  const addResultMutation = useMutation({
    mutationFn: (data: {
      session_id: number;
      asset_id: number;
      found: boolean;
      actual_location_type?: string;
      actual_location_id?: number;
    }) => inventoryService.addResult(data.session_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-results', currentSessionId] });
      setScanNumber('');
      queryClient.removeQueries({ queryKey: ['scan-asset'] });
    },
  });

  const handleScan = () => {
    if (scanNumber && currentSessionId) {
      scanAsset();
    }
  };

  const handleConfirmFound = () => {
    if (scannedAsset && currentSessionId) {
      addResultMutation.mutate({
        session_id: currentSessionId,
        asset_id: scannedAsset.id,
        found: true,
        actual_location_type: scannedAsset.location_type,
        actual_location_id: scannedAsset.location_id,
      });
    }
  };

  const handleConfirmNotFound = () => {
    if (scannedAsset && currentSessionId) {
      addResultMutation.mutate({
        session_id: currentSessionId,
        asset_id: scannedAsset.id,
        found: false,
      });
    }
  };

  const handleStartSession = () => {
    createSessionMutation.mutate({ description: sessionDescription || undefined });
  };

  const handleCompleteSession = () => {
    if (currentSessionId) {
      completeSessionMutation.mutate(currentSessionId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setIsNewSessionModalOpen(true)}>New Session</Button>
      </div>

      {/* Sessions List */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={currentSessionId === session.id ? 'ring-2 ring-primary-500' : ''}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">Session #{session.id}</div>
                    {session.completed_at ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Started: {new Date(session.started_at).toLocaleString()}
                  </div>
                  {session.description && (
                    <div className="text-sm text-gray-600">{session.description}</div>
                  )}
                  {session.completed_at && (
                    <div className="text-sm text-gray-500">
                      Completed: {new Date(session.completed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Current Session */}
      {currentSession && !currentSession.completed_at && (
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Session #{currentSession.id}</h2>
                <div className="text-sm text-gray-500">
                  Started: {new Date(currentSession.started_at).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Checked: {results.length} assets
                </div>
              </div>
              <Button variant="danger" onClick={handleCompleteSession}>
                Complete Session
              </Button>
            </div>

            <div className="mb-4">
              <Input
                label="Scan Inventory Number"
                placeholder="Scan or enter inventory number"
                value={scanNumber}
                onChange={(e) => setScanNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              />
              <Button onClick={handleScan} className="mt-2" disabled={!scanNumber}>
                Scan
              </Button>
            </div>

            {scannedAsset && (
              <Card className="bg-blue-50">
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{scannedAsset.inventory_number}</div>
                  <div className="text-gray-600">
                    {scannedAsset.vendor} {scannedAsset.model}
                  </div>
                  <div className="text-sm text-gray-500">
                    Serial: {scannedAsset.serial_number}
                  </div>
                  <div className="text-sm">
                    Location:{' '}
                    {scannedAsset.location_type === LocationType.employee
                      ? `Employee #${scannedAsset.location_id}`
                      : `Warehouse #${scannedAsset.location_id}`}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="primary" onClick={handleConfirmFound} className="flex-1">
                      Found ✓
                    </Button>
                    <Button variant="danger" onClick={handleConfirmNotFound} className="flex-1">
                      Not Found ✗
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Results List */}
            {results.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Checked Assets</h3>
                <div className="space-y-2">
                  {results.map((result) => (
                    <Card key={result.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Asset ID: {result.asset_id}</div>
                          {result.actual_location_type && (
                            <div className="text-sm text-gray-500">
                              Location:{' '}
                              {result.actual_location_type === LocationType.employee
                                ? `Employee #${result.actual_location_id}`
                                : `Warehouse #${result.actual_location_id}`}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            result.found
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.found ? 'Found' : 'Not Found'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* New Session Modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => {
          setIsNewSessionModalOpen(false);
          setSessionDescription('');
        }}
        title="New Inventory Session"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Description (optional)"
            placeholder="Enter session description"
            value={sessionDescription}
            onChange={(e) => setSessionDescription(e.target.value)}
          />
          <Button
            onClick={handleStartSession}
            variant="primary"
            fullWidth
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? 'Creating...' : 'Start Session'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
