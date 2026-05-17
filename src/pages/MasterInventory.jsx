import { useState } from "react";

const mockData = [
    {
        codigo: "P001",
        prenda: "Playera Negra",
        stock: 15,
        tienda: "Centro",
        costo: 120,
        precio: 250,
    },
    {
        codigo: "P002",
        prenda: "Sudadera Gris",
        stock: 8,
        tienda: "Norte",
        costo: 220,
        precio: 450,
    },
    {
        codigo: "P003",
        prenda: "Jeans Azul",
        stock: 20,
        tienda: "Sur",
        costo: 300,
        precio: 600,
    },
];

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [store, setStore] = useState("Todas");

    const role = "admin"; // cambia a "empleado" para probar

    const filteredData = mockData.filter((item) => {
        const matchesSearch = item.prenda
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesStore =
            store === "Todas" || item.tienda === store;

        return matchesSearch && matchesStore;
    });

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">
                    Inventario Maestro
                </h1>

                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Buscar prenda..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg w-full"
                    />

                    <select
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg"
                    >
                        <option>Todas</option>
                        <option>Centro</option>
                        <option>Norte</option>
                        <option>Sur</option>
                    </select>

                    {role === "admin" && (
                        <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold">
                            Nuevo Artículo
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border border-zinc-800">
                        <thead className="bg-zinc-900">
                            <tr>
                                <th className="p-3 text-left">Código</th>
                                <th className="p-3 text-left">Prenda</th>
                                <th className="p-3 text-left">Stock</th>
                                <th className="p-3 text-left">Tienda</th>

                                {role === "admin" && (
                                    <>
                                        <th className="p-3 text-left">Costo</th>
                                        <th className="p-3 text-left">Precio</th>
                                        <th className="p-3 text-left">Acciones</th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.map((item) => (
                                <tr
                                    key={item.codigo}
                                    className="border-t border-zinc-800"
                                >
                                    <td className="p-3">{item.codigo}</td>
                                    <td className="p-3">{item.prenda}</td>
                                    <td className="p-3">{item.stock}</td>
                                    <td className="p-3">{item.tienda}</td>

                                    {role === "admin" && (
                                        <>
                                            <td className="p-3">${item.costo}</td>
                                            <td className="p-3">${item.precio}</td>

                                            <td className="p-3">
                                                <button className="bg-zinc-700 px-3 py-1 rounded">
                                                    Editar
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}