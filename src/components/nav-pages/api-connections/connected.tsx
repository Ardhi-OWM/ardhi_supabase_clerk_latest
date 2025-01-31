"use client";
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'; // Clerk authentication hook

import AddApi from './AddApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ButtonMine from "@/components/reusable/button-mine";

interface Service {
    id?: number;
    user_id: string;  // Clerk user ID remains
    name: string;
    provider: string;
    type: string;
    region: string;
    apiUrl: string;
    created_at?: string;
}

const ConnectedApiEndpoints = () => {
    const { user } = useUser(); // Fetching Clerk authenticated user
    const [services, setServices] = useState<Service[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch data from local storage or external API (if needed)
        const storedServices = localStorage.getItem("services");
        if (storedServices) {
            setServices(JSON.parse(storedServices));
        }
    }, [user]);

    // ---------- Add a New Service Linked to the User ----------
    const addService = async (newService: Service) => {
        if (!user || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const updatedServices = [...services, { ...newService, user_id: user.id }];
            setServices(updatedServices);
            localStorage.setItem("services", JSON.stringify(updatedServices));

            alert('Service added successfully!');
        } catch (error) {
            console.error("Error adding service:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ------------- Delete Service from Local State -----------
    const deleteService = async (id: number) => {
        if (!confirm("Are you sure you want to delete this service?")) return;
        if (!user) return;

        try {
            const updatedServices = services.filter((service) => service.id !== id);
            setServices(updatedServices);
            localStorage.setItem("services", JSON.stringify(updatedServices));

            alert("Service deleted successfully!");
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    // ------------- Date formatting  -----------
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="w-full flex flex-col ">
            <h1 className="text-2xl ubuntu-mono-bold mb-4">Connected API Endpoints</h1>

            {/* Button to Open Modal */}
            <div className="flex justify-center w-1/2 md:w-1/4 my-6">
                <ButtonMine
                    href={undefined}
                    className="w-full mx-auto px-4 text-xs sm:text-sm leading-tight"
                    onClick={() => setIsModalOpen(true)}
                    white={false}
                    px={4}
                >
                    <span className="hover:text-green-600 hover:underline "> Add API Endpoint </span>
                </ButtonMine>
            </div>

            {isModalOpen && (
                <AddApi
                    onClose={() => setIsModalOpen(false)}
                    onServiceAdded={(service) => addService({
                        ...service,
                        user_id: user?.id || '' // Ensure user ID is included
                    })}
                />
            )}

            {/* ----------------- Services Table -----------------*/}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>API URL</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service, index) => (
                        <TableRow key={service.id || index}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{service.provider}</TableCell>
                            <TableCell>{service.region}</TableCell>
                            <TableCell className="text-sm text-blue-500 underline ibm-plex-mono-regular-italic">
                                <a href={service.apiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                    {service.apiUrl}
                                </a>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(service.created_at)}</TableCell>
                            <TableCell>
                                <button
                                    onClick={() => deleteService(service.id!)}
                                    className="bg-red-400 px-4 py-1 rounded hover:bg-red-600 text-sm"
                                >
                                    Delete
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ConnectedApiEndpoints;
