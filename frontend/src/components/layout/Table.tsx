import { useState } from "react";
// Table
import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, Column } from '@tanstack/react-table';
// Sections
import { PaginationSection } from "../sections/table/section/PaginationSection";


interface TableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    totalRow?: Partial<T> & { id?: number | string };
};


const Table = <T,>({ data, columns, totalRow }: TableProps<T>) => {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
        },
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting
        },
        onSortingChange: setSorting,
    });

    const renderSortIcon = (column: Column<T>) => {
        const sortState = column.getIsSorted();
        return {
            'asc': "⬆️",
            'desc': "⬇️",
            'none': "↕️"
        }[sortState || 'none'];

    };

    return (
        <section className="border border-outline-variant/10 flex flex-col gap-y-4 items-center justify-center overflow-hidden p-4 rounded-xl shadow-sm w-full">
            <div className="overflow-x-auto w-full">
                <table className="border-collapse text-left w-full">
                    <thead className="text-sm lg:text-lg">
                        {
                            table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="bg-surface-container-lowest/50">
                                    {
                                        headerGroup.headers.map(header => (
                                            <th key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                className="border-b border-outline-variant/10 font-black px-3 py-4 text-[11px] text-secondary tracking-widest uppercase">
                                                {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext()
                                                )}
                                                {
                                                    renderSortIcon(header.column)
                                                }
                                            </th>
                                        ))}
                                </tr>
                            ))
                        }
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-sm lg:text-lg">
                        {
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="group transition-colors hover:bg-nav/5">
                                    {
                                        row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-2 py-4 text-outline">{flexRender(cell.column.columnDef.cell, cell.getContext())
                                            }</td>
                                        ))
                                    }
                                </tr>
                            ))
                        }
                        {/* Fila del total que estará siempre al final */}
                        {totalRow && (
                            <tr
                                className="bg-surface-container-high text-secondary font-bold md:text-xl">
                                {table.getAllColumns().map((column) => {
                                    const accessorKey = column.id;
                                    const value = totalRow[accessorKey as keyof typeof totalRow] ?? '';

                                    return (
                                        <td key={column.id} className="px-2 py-2">
                                            {String(value)}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                    </tbody>
                </table>                
                <PaginationSection
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalPages={table.getPageCount()}
                    onPageChange={(page: number) => table.setPageIndex(page - 1)}
                />
            </div>
        </section>
    );
};
export default Table;