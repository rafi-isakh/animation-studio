"use client"
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const UserWithSameEmailExistsModalComponent = () => {

    const {language, dictionary} = useLanguage();
    const [openModal, setOpenModal] = useState(true);
    const router = useRouter();
    const { logout} = useAuth();

    const confirm = () => {
        setOpenModal(false);
        logout(true, '/');
    }

    return (
        <div>
            <Modal show={openModal} size='md' onClose={() => confirm()} popup>
                <Modal.Header />
                <Modal.Body>
                <div className="max-w-screen-md py-4 flex flex-col space-y-4 mx-auto justify-start">
                    <div className="font-bold">{phrase(dictionary, "emailExists", language)}</div>
                    <button className="button-style px-5 py-2.5 me-2 mb-2" onClick={confirm}>{phrase(dictionary, "ok", language)}</button>
                </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default UserWithSameEmailExistsModalComponent;