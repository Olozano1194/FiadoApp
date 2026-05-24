import React from "react";
//icons
import { RiInboxLine } from 'react-icons/ri';
import { IoMdNotifications } from "react-icons/io";
import { FaWhatsapp } from "react-icons/fa6";
//Enlaces
import { Link } from "react-router-dom";
//react-menu
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';



const NotificationMenu = () => { 

    return (
        <Menu>
            <MenuButton className="cursor-pointer text-nav relative hover:text-title p-2 transition-colors">
                <IoMdNotifications className="text-2xl text-surface-variant" />                
            </MenuButton>
            <MenuItems anchor='bottom end' className='bg-surface-container-lowest mt-1 p-4 rounded-lg max-h-[70vh] overflow-y-auto w-96'>
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-title font-medium">Notificaciones</h1>                    
                </div>
                <hr className="my-3 border-nav/30" />                
                    <div className="text-center py-4">
                        <RiInboxLine className="mx-auto text-3xl text-nav/30 mb-2" />
                        <p className="text-nav">No hay notificaciones</p>
                    </div>
                        <React.Fragment>
                            <MenuItem as='div' className='p-0 hover:bg-slate-100'>
                                <div className="flex flex-col">
                                    <Link
                                        to='#'
                                        className="flex flex-1 items-start gap-x-3 py-2 px-4 hover:bg-slate-100 transition-colors rounded-lg text-dark"
                                    >
                                        {}
                                        <div className="text-sm flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-medium">{}</span>
                                                <span className="text-xs text-nav">{}</span>
                                            </div>
                                            <p className="text-dark mt-1">{}</p>
                                        </div>
                                    </Link>
                                    
                                    {/* Botón de WhatsApp */}
                                    <a
                                            href='#'
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 mx-4 mb-2 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <FaWhatsapp className="text-lg" />
                                            Enviar mensaje por WhatsApp
                                        </a>                                   
                                </div>
                            </MenuItem>                            
                        </React.Fragment>                   
                <hr className="my-3 border-nav/30" />
            </MenuItems>
        </Menu>
    );
}
export default NotificationMenu;