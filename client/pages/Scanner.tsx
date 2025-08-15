# nimrev/security_scanner/scanner_service.py
# This file contains the core logic for running the security tools and parsing the results.
# It is designed to be run as a Celery worker.

import asyncio
import json
import subprocess
import os
import uuid
from typing import Dict, Any, List

class SecurityScannerService:
    """
    Core service to execute security analysis on smart contracts.
    This class is intended to be used by a background worker (like Celery).
    """

    def __init__(self):
        # Configure paths to the security tools
        # These assume the tools are installed and available in the worker's PATH
        self.tools = {
            "slither": "slither",
            "mythril": "mythril" # Mythril is optional due to installation complexity
        }
        self.scan_directory = "/tmp/scans"
        os.makedirs(self.scan_directory, exist_ok=True)

    async def scan_contract(self, scan_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrates the entire scanning process for a single contract.
        
        Args:
            scan_request (Dict): A dictionary containing 'source_code', 'blockchain', etc.
        
        Returns:
            Dict: A dictionary representing the complete scan result.
        """
        scan_id = str(uuid.uuid4())
        contract_path = os.path.join(self.scan_directory, f"{scan_id}.sol")
        
        # Initializing the result object
        scan_result = {
            "scan_id": scan_id,
            "status": "RUNNING",
            "score": 100, # Start with a perfect score
            "blockchain": scan_request.get("blockchain", "unknown"),
            "issues": [],
            "metadata": {"file_path": contract_path, "tools_executed": []},
        }

        try:
            # Step 1: Write the contract source code to a temporary file
            self._write_contract_to_file(contract_path, scan_request["source_code"])

            # Step 2: Run Slither-analyzer
            slither_output = await self._run_slither_scan(contract_path)
            scan_result["metadata"]["tools_executed"].append("slither")
            slither_issues = self._parse_slither_output(slither_output)
            scan_result["issues"].extend(slither_issues)
            
            # Update the score based on Slither's findings
            scan_result["score"] = self._calculate_score(scan_result["issues"])
            
            # Step 3: Run Mythril (optional)
            # You would implement a similar method here for Mythril or other tools.
            # mythril_output = await self._run_mythril_scan(contract_path)
            # mythril_issues = self._parse_mythril_output(mythril_output)
            # scan_result["issues"].extend(mythril_issues)

            # Finalize the status based on findings
            scan_result["status"] = "PASS" if not scan_result["issues"] else "FAIL"

        except Exception as e:
            print(f"Error during scan for {scan_id}: {e}")
            scan_result["status"] = "ERROR"
            scan_result["score"] = 0
            scan_result["issues"].append({
                "severity": "CRITICAL",
                "tool": "Service",
                "description": f"An internal error occurred: {str(e)}"
            })

        finally:
            # Step 4: Clean up the temporary file
            self._cleanup_file(contract_path)
        
        return scan_result

    def _write_contract_to_file(self, path: str, source_code: str):
        """Writes the contract source code to a file."""
        with open(path, "w") as f:
            f.write(source_code)

    async def _run_slither_scan(self, contract_path: str) -> str:
        """Runs the Slither tool and returns the raw JSON output."""
        # Note: We use '--json' to get structured output which is easier to parse.
        cmd = [self.tools["slither"], contract_path, "--json", "slither_output.json"]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Slither prints some output to stderr, we need to capture stdout from the json file.
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"Slither failed with error: {stderr.decode()}")
        
        # Read the generated JSON file
        with open("slither_output.json", "r") as f:
            output = f.read()
        os.remove("slither_output.json")
        
        return output

    def _parse_slither_output(self, output: str) -> List[Dict[str, Any]]:
        """Parses the JSON output from Slither into a list of issues."""
        parsed_issues = []
        data = json.loads(output)
        
        if "results" in data and "detectors" in data["results"]:
            for finding in data["results"]["detectors"]:
                # Slither has 'high', 'medium', 'low', 'informational'
                # Map them to our internal severities
                severity = finding["impact"].upper()
                if severity == "INFORMATIONAL":
                    severity = "AMBIGUOUS"
                
                parsed_issues.append({
                    "tool": "Slither",
                    "severity": severity,
                    "description": finding["description"],
                    "line_info": finding["elements"][0]["source_mapping"] if finding["elements"] else None
                })
        
        return parsed_issues

    def _calculate_score(self, issues: List[Dict[str, Any]]) -> int:
        """Calculates a security score based on the issues found."""
        score_deduction = {
            "CRITICAL": 50,
            "HIGH": 30,
            "MEDIUM": 15,
            "LOW": 5,
            "AMBIGUOUS": 0
        }
        
        final_score = 100
        for issue in issues:
            final_score -= score_deduction.get(issue["severity"], 0)
        
        return max(0, final_score)

    def _cleanup_file(self, path: str):
        """Removes the temporary contract file."""
        if os.path.exists(path):
            os.remove(path)


# nimrev-frontend/src/components/SecurityScanner/SecurityDashboard.tsx
// This component has been updated to handle real-time progress tracking
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Progress, Input, Select, notification } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { SecurityScanApi } from '../api/security-scan-api';

const { TextArea } = Input;
const { Option } = Select;

interface ScanResult {
    scan_id: string;
    status: 'PASS' | 'REVIEW' | 'INCONCLUSIVE' | 'FAIL' | 'RUNNING' | 'ERROR';
    score: number;
    blockchain: string;
    timestamp: string;
    progress_message?: string; // New field for progress updates
}

export const SecurityDashboard: React.FC = () => {
    const [scans, setScans] = useState<ScanResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [contractCode, setContractCode] = useState('');
    const [blockchain, setBlockchain] = useState('ethereum');

    // This useEffect hook simulates a real-time progress stream
    useEffect(() => {
        // Here you would connect to a WebSocket or SSE endpoint
        // For this example, we'll simulate the updates with a mock function
        const simulateProgress = (scanId: string) => {
            const messages = [
                "Scan initiated...",
                "Analyzing with Slither...",
                "Running static analysis...",
                "Parsing results...",
                "Calculating security score...",
                "Scan complete."
            ];

            let step = 0;
            const interval = setInterval(() => {
                if (step < messages.length) {
                    setScans(prevScans =>
                        prevScans.map(s =>
                            s.scan_id === scanId
                                ? { ...s, progress_message: messages[step], status: 'RUNNING' }
                                : s
                        )
                    );
                    step++;
                } else {
                    clearInterval(interval);
                    setScans(prevScans =>
                        prevScans.map(s =>
                            s.scan_id === scanId
                                ? {
                                    ...s,
                                    status: Math.random() > 0.5 ? 'PASS' : 'FAIL', // Randomly set final status for simulation
                                    score: Math.floor(Math.random() * 100),
                                    progress_message: undefined
                                }
                                : s
                        )
                    );
                    setIsScanning(false);
                    notification.success({
                        message: 'Scan Finished',
                        description: `The scan with ID ${scanId.substring(0, 8)}... has completed.`,
                        placement: 'bottomRight',
                    });
                }
            }, 1500); // Send a new message every 1.5 seconds

            return () => clearInterval(interval);
        };

        const currentScanning = scans.find(s => s.status === 'RUNNING');
        if (currentScanning && !currentScanning.progress_message) {
            return simulateProgress(currentScanning.scan_id);
        }

        return () => {};
    }, [scans]);

    const initiateScan = async () => {
        setIsScanning(true);
        const newScan = {
            scan_id: `scan-${new Date().getTime()}`,
            status: 'RUNNING',
            score: 100,
            blockchain: blockchain,
            timestamp: new Date().toISOString(),
        };
        setScans(prev => [newScan, ...prev]);

        // In a real implementation, you would send the request to the API
        // const result = await SecurityScanApi.scan({ source_code: contractCode, blockchain });
        // The API would return a `scan_id`, which you'd then use to listen for updates.
    };

    const getStatusColor = (status: string) => {
        const colors = {
            PASS: 'green',
            REVIEW: 'orange',
            INCONCLUSIVE: 'yellow',
            FAIL: 'red',
            RUNNING: 'blue',
            ERROR: 'red'
        };
        return colors[status] || 'default';
    };

    const columns = [
        {
            title: 'Scan ID',
            dataIndex: 'scan_id',
            key: 'scan_id',
            render: (text: string) => text.substring(0, 8) + '...'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: ScanResult) => (
                <Badge
                    color={getStatusColor(status)}
                    text={
                        status === 'RUNNING'
                            ? (
                                <span>
                                    <LoadingOutlined style={{ marginRight: 8 }} />
                                    {record.progress_message || 'Scanning...'}
                                </span>
                            )
                            : status
                    }
                />
            )
        },
        {
            title: 'Security Score',
            dataIndex: 'score',
            key: 'score',
            render: (score: number, record: ScanResult) => {
                if (record.status === 'RUNNING') {
                    return <Progress percent={0} size="small" showInfo={false} />;
                }
                return (
                    <Progress
                        percent={Math.max(0, 100 - score)}
                        size="small"
                        status={score > 50 ? 'exception' : 'success'}
                    />
                );
            }
        },
        {
            title: 'Blockchain',
            dataIndex: 'blockchain',
            key: 'blockchain'
        },
        {
            title: 'Date',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text: string) => new Date(text).toLocaleDateString()
        }
    ];

    return (
        <div className="p-8">
            <Card title="Security Scanner Dashboard" className="rounded-lg shadow-xl">
                <div className="space-y-6">
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Initiate New Scan</h3>
                        <div className="flex space-x-4">
                            <Select
                                value={blockchain}
                                onChange={value => setBlockchain(value)}
                                className="w-1/3"
                                size="large"
                            >
                                <Option value="ethereum">Ethereum</Option>
                                <Option value="polygon">Polygon</Option>
                                <Option value="bsc">BSC</Option>
                                <Option value="solana">Solana</Option>
                            </Select>
                            <Button
                                type="primary"
                                onClick={initiateScan}
                                loading={isScanning}
                                disabled={isScanning || !contractCode}
                                className="w-2/3 rounded-lg"
                                size="large"
                            >
                                {isScanning ? 'Scanning...' : 'Start Scan'}
                            </Button>
                        </div>
                        <TextArea
                            rows={10}
                            value={contractCode}
                            onChange={e => setContractCode(e.target.value)}
                            placeholder="Paste your smart contract source code here..."
                            className="rounded-lg"
                        />
                    </div>
                    <div className="mt-8">
                        <Table
                            columns={columns}
                            dataSource={scans}
                            rowKey="scan_id"
                            pagination={{ pageSize: 20 }}
                            className="rounded-lg shadow-inner"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};
