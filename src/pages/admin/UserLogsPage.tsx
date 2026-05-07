import { useState, useEffect } from 'react';
import { getDataHandlerWithToken } from '@/config/services';
import { format } from 'date-fns';
import ApiConfig from '@/config/apiConfig';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface UserLog {
    _id: string;
    userId?: {
        _id: string;
        name: string;
        employeeId: number;
        email: string;
    };
    ip: string;
    device: string;
    action: string;
    status: string;
    log: string;
    reason?: string;
    meta?: {
        email?: string;
        logoutAt?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export function UserLogsPage() {
    const [logs, setLogs] = useState<UserLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);

    // 🔹 Fetch all users
    const fetchUsers = async () => {
        try {
            const response = await getDataHandlerWithToken(ApiConfig.getAllProfile,null,null,true);
            console.log("Users response:", response);
            if (response) {
                setUsers(response);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };
    // 🔹 Fetch logs (all or by user)
    const fetchLogs = async (userId?: string) => {
        try {
            setLoading(true);
            console.log("Fetching logs for user:", userId || "ALL");
            let response:any;
            if (userId && userId !== 'ALL') {
                response = await getDataHandlerWithToken(
                    ApiConfig.getUserLogsByUserId(userId),null,null,true
                );
            } else {
                response = await getDataHandlerWithToken(
                    ApiConfig.getUserLogs,null,null,true
                );
            }
            console.log("Logs response:", response);

            if (response) {
                setLogs(response);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, []);

    // 🔹 Handle dropdown change
    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        setSelectedUser(userId);
        fetchLogs(userId);
    };

    if (loading) {
        return <div>Loading logs...</div>;
    }

    return (
        <div style={{ padding: '16px' }}>
            <h2>User Logs</h2>

            {/* 🔽 USER DROPDOWN */}
            <div style={{ marginBottom: '12px' }}>
                <select
                    value={selectedUser}
                    onChange={handleUserChange}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                    }}
                >
                    <option value="ALL">All Users</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
            </div>

            {logs.length === 0 ? (
                <p>No logs found</p>
            ) : (
                <div
                    style={{
                        background: '#111',
                        color: '#0f0',
                        padding: '12px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        maxHeight: '500px',
                        overflowY: 'auto',
                    }}
                >
                    {logs.map((log) => {
                        const time = format(
                            new Date(log.createdAt),
                            'yyyy-MM-dd HH:mm:ss'
                        );

                        const user = log.userId
                            ? `${log.userId.name} (${log.userId.email})`
                            : `Unknown (${log.meta?.email || 'N/A'})`;

                        return (
                            <div key={log._id} style={{ marginBottom: '6px' }}>
                                [{time}]
                                {" | "}
                                {user}
                                {" | "}
                                {log.action}
                                {" | "}
                                {log.status.toUpperCase()}
                                {" | "}
                                IP: {log.ip}
                                {" | "}
                                {log.log}
                                {log.reason && ` | Reason: ${log.reason}`}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}