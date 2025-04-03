import PurchaseStarsComponent from "@/components/PurchaseStarsComponent";
import StarsTransactionComponent from "@/components/StarsTransactionComponent";
import { replaceSmartQuotes } from '@/utils/font';
import { terms_purchase_stars_ko, terms_purchase_stars_english } from '@/utils/terms';
import DictionaryPhrase from "@/components/DictionaryPhrase";
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
    purchase_type: string;
    free_use: boolean;
}

export default async function Stars({ searchParams }: { searchParams: { event?: string, package?: string } }) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/signin");
    }
    return (
        <div className="relative w-full mx-auto">
            {/* TODO: remove this temporary feature for KG inicis integration */}
                <div className="flex-1 shrink-0">
                    {email == "sparklycabbage0@gmail.com" ? <PurchaseStarsKGInicisComponent /> : <PurchaseStarsComponent />}
                </div>
            {/* terms of use */}
            <div className="md:w-[360px] w-full mx-auto text-[10px] text-left py-2 px-2 text-black dark:text-gray-500">
                <div className='w-full whitespace-pre-wrap'>
                    {replaceSmartQuotes(terms_purchase_stars_ko)}
                </div>
            </div>
        </div>
    );
}