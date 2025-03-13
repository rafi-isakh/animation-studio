import PurchaseStarsComponent from "@/components/PurchaseStarsComponent";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Button } from "@mui/material";
import StarsTransactionComponent from "@/components/StarsTransactionComponent";
import { replaceSmartQuotes } from '@/utils/font';
import { terms_purchase_stars_ko, terms_purchase_stars_english } from '@/utils/terms';
import DictionaryPhrase from "@/components/DictionaryPhrase";
import Link from "next/link";
import PurchaseStarsKGInicisComponent from "@/components/PurchaseStarsKGInicisComponent";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Currency = "KRW" | "USD" | "EUR";

export interface Transaction {
    stars: number;
    price: number;
    date: string;
    currency: Currency;
}

export interface StarUse {
    user_id: number;
    stars: number;
    date: string;
}

export default async function Stars({searchParams}: {searchParams: {event?: string, package?: string}}) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/login");
    }

    return (
        <div className="relative md:max-w-screen-lg w-full mx-auto">
            {/* TODO: remove this temporary feature for KG inicis integration */}
            <div className="flex justify-center mt-6 mb-4">
                <Link href="/stars/transactions">
                    <Button 
                        variant="outlined" 
                        color="gray"
                        className="px-4 py-2"
                    >
                        View Transaction History
                    </Button>
                </Link>
            </div>
            {email == "sparklycabbage0@gmail.com" ? <PurchaseStarsKGInicisComponent /> : <PurchaseStarsComponent />}
            {/* terms of use */}
            <div className="md:w-[360px] w-full mx-auto text-[10px] text-left py-2 px-2 text-black dark:text-gray-500">
                <div className='w-full whitespace-pre-wrap'>
                    {replaceSmartQuotes(terms_purchase_stars_ko)}
                </div>
            </div>


        </div>
    );
}