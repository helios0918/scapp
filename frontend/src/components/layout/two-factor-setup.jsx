import { useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apiClient } from '@/services/api-client';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export function TwoFactorSetup({ isEnabled, onEnabled }) {
    const [setupData, setSetupData] = useState(null);
    const [qrCodeData, setQrCodeData] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    async function initiateSetup() {
        const { data } = await apiClient.get('/api/auth/tfa/setup');
        const qrUrl = await QRCode.toDataURL(data.qrCodeUrl);
        setSetupData(data);
        setQrCodeData(qrUrl);
    }

    async function verifySetup() {
        const normalized = code.replace(/\D/g, "");
        if (normalized.length !== 6) {
            setError("Enter a valid 6-digit code.");
            return;
        }
        try {
            await apiClient.post('/api/auth/tfa/verify', { code: normalized });
            onEnabled(); // Callback to refresh profile
            setSetupData(null);
        } catch (err) {
            setError("Invalid code. Try again.");
        }
    }

    if (isEnabled) {
        return (
            <div className="flex items-center gap-2 text-green-600 font-medium">
                <ShieldCheck className="h-5 w-5" />
                Authenticator Active
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!setupData ? (
                <Button variant="outline" className="w-full rounded-xl" onClick={initiateSetup}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Enable Authenticator App
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-4 border p-4 rounded-2xl bg-zinc-50">
                    <img src={qrCodeData} alt="QR Code" className="rounded-lg shadow-sm" />
                    <div className="text-center space-y-1">
                        <p className="text-sm font-semibold">Scan with Google Authenticator</p>
                        <p className="text-xs text-muted-foreground">Or enter manually: <code className="bg-zinc-200 px-1">{setupData.secret}</code></p>
                    </div>
                    <div className="w-full space-y-2">
                        <Label>Enter 6-digit verification code</Label>
                        <Input
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            maxLength={6}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <Button className="w-full rounded-xl" onClick={verifySetup}>Verify and Activate</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
