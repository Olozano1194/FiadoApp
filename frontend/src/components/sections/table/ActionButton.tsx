import React from 'react';
//Enlaces
import { Link } from "react-router-dom";
//Mensajes
import { toast } from 'react-hot-toast';
//Icons
import { RiDeleteBinLine, RiPencilLine } from "react-icons/ri";
import { TOAST_DEFAULT_STYLES } from '../../../utils/toastStyles';

interface ActionButtonsProps {
    id: number;
    editPath: string;
    onDelete: (id: number) => Promise<void>;
    confirmMessage: string;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ id, editPath, onDelete, confirmMessage = '¿Estas seguro de eliminar este registro?' }) => {

    const handleDelete = async () => {
        if (!window.confirm(confirmMessage)) return;

        try {
            await onDelete(id);
            toast.success('Eliminado correctamente', {
                duration: 3000,
                position: 'bottom-right',
                style: TOAST_DEFAULT_STYLES,
            });             
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex justify-center items-center gap-x-4">
            <Link
                to={editPath}
                className="text-green-600 text-2xl p-2 rounded-md hover:scale-110"
            >
                <RiPencilLine />
            </Link>
            <button
                onClick={handleDelete}
                className="cursor-pointer text-red-500 text-xl p-2 rounded-md hover:scale-110"
            >
                <RiDeleteBinLine />
            </button>
        </div>

    );
};
export default ActionButtons;