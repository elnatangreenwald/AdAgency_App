/**
 * Clients Grid Component
 * Displays a searchable grid of client cards
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Client } from '@/types';

interface ClientsGridProps {
  clients: Array<{ id: string; name: string }>;
  title?: string;
}

export function ClientsGrid({ clients, title = 'הלקוחות שלך:' }: ClientsGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="חפש לקוח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
        {filteredClients.map((client) => (
          <Link
            key={client.id}
            to={`/client/${client.id}`}
            className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center font-bold text-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95 border border-gray-200 hover:border-[#0073ea] relative overflow-hidden group text-sm sm:text-base"
          >
            <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#3d817a] to-[#2d6159] transform scale-y-0 group-hover:scale-y-100 transition-transform" />
            {client.name}
          </Link>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            לא נמצאו לקוחות
          </div>
        )}
      </div>
    </div>
  );
}
