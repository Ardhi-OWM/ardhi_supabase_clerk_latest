"use client";
import { useState } from 'react';
import { useUser } from "@clerk/nextjs";  // Clerk authentication
import apiClient from "@/lib/apiClient"; // Centralized Axios instance

interface Service {
    id?: number;
    user_id?: string;
    name: string;
    provider: string;
    type: string;
    region: string;
    apiUrl: string;
    created_at?: string;
}

const AddApi = ({ onClose, onServiceAdded }: {
    onClose: () => void;
    onServiceAdded: (service: Service) => void
}) => {
    const { user } = useUser(); // Get user details
    const [apiUrl, setApiUrl] = useState('');
    const [newService, setNewService] = useState<Service>({
        name: '',
        provider: '',
        type: '',
        region: '',
        apiUrl: '',
    });
    const [loading, setLoading] = useState(false);

    //  ---------- Parse API URL and Extract Name, Provider, and Region ----------
    const parseApiUrl = (url: string) => {
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error('Invalid URL format');
            }

            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // Extract the name from the subdomain
            const name = hostname.split('.')[0];

            // Extract the provider
            const provider =
                hostname.includes('amazonaws') ? 'AWS' :
                hostname.includes('core.windows') ? 'Azure' :
                hostname.includes('cloud-object-storage') ? 'IBM Cloud' :
                hostname.includes('googleapis') ? 'Google Cloud' :
                hostname.includes('digitaloceanspaces') ? 'DigitalOcean' :
                'Unknown';

            // Extract the region
            const parts = hostname.split('.');
            const region = urlObj.searchParams.get('region') ||
                parts.find(part => part.match(/[a-z]{2,3}-[a-z]+-\d/)) ||
                'Unknown';

            // Update the newService state
            setNewService({
                ...newService,
                apiUrl: url,
                provider,
                region,
                name,
            });
        } catch (error) {
            console.error('Invalid URL format', error);
        }
    };

    //  -------------- Save Service to Backend and Local Storage -------------
    const insertService = async () => {
        if (!user) {
            alert("You need to be logged in to add an API.");
            return;
        }

        setLoading(true);
        try {
            // Fetch existing services from localStorage
            const storedServices = localStorage.getItem("services");
            const existingServices: Service[] = storedServices ? JSON.parse(storedServices) : [];

            // Check if API already exists
            if (existingServices.some(service => service.apiUrl === newService.apiUrl)) {
                alert('This API URL already exists.');
                setLoading(false);
                return;
            }

            // Prepare backend request payload
            const payload = {
                user_id: user.id, // Send user ID
                name: newService.name,
                provider: newService.provider,
                region: newService.region,
                api_url: newService.apiUrl,
            };

            // Send API request to backend
            const response = await apiClient.post("/api-endpoints/", payload);
            const savedService = response.data as Service;


            // Add new service to local storage
            const updatedServices = [...existingServices, savedService];
            localStorage.setItem("services", JSON.stringify(updatedServices));

            alert('Service added successfully!');
            onServiceAdded(savedService);

            // Reset fields
            setNewService({ name: '', provider: '', type: '', region: '', apiUrl: '' });
            setApiUrl('');
            onClose();
        } catch (error: any) {
            console.error('Unexpected error:', error);
            if (error.response && error.response.data.error) {
                alert(error.response.data.error); // Show backend error
            } else {
                alert("Failed to add service. Please try again.");
            }
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 w-1/2 ">
                <h2 className="text-xl mb-4 roboto-mono-semibold">Add API Endpoint</h2>
                <input
                    type="text"
                    placeholder="Enter API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    onBlur={() => parseApiUrl(apiUrl)}
                    required
                    className="w-full ibm-plex-mono-regular-italic border border-purple-300 rounded p-2 mb-4 text-sm"
                />
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={insertService}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddApi;
