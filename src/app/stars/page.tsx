"use client"
import { useEffect, useState } from "react";
import PurchaseStarsComponent from "@/components/PurchaseStarsComponent";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { phrase } from "@/utils/phrases";
import { Box } from "@mui/material";
import StarsTransactionComponent from "@/components/StarsTransactionComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/StripeCheckoutForm";
import CompletePage from "@/components/StripeCompletePage";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface Transaction {
    stars: number;
    price: number;
    date: string;
    currency: string;
}

export default function Stars() {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    const [clientSecret, setClientSecret] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [dpmCheckerLink, setDpmCheckerLink] = useState("");

    useEffect(() => {
        setConfirmed(!!new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        ));
    });

    useEffect(() => {
        // Create PaymentIntent as soon as the page loads
        fetch("/api/stripe_create_payment_intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{ id: "xl-tshirt" }] }),
        })
            .then((res) => res.json())
            .then((data) => {
                setClientSecret(data.clientSecret);
                // [DEV] For demo purposes only
                setDpmCheckerLink(data.dpmCheckerLink);
            });
    }, []);

    const appearance = {
        theme: 'stripe',
    };
    const options = {
        clientSecret,
        appearance,
    };

    return (
        <div className="md:max-w-screen-lg w-full mx-auto">
            <TabContext value={tabValue} >
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-center items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'gray', // Default tab color
                                    '&.Mui-selected': {
                                        color: '#DB2777', // Color when tab is selected
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#DB2777', // Indicator color
                                }
                            }}
                            className={`first-line:dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                     `}
                        >
                            <Tab
                                label={phrase(dictionary, "stars", language)}
                                value="1"
                                className="dark:text-white dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                 md:w-auto sm:w-[10px]
                                " />
                            <Tab label={phrase(dictionary, "starsTransaction", language)}
                                value="2"
                                className="dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#8A2BE2]
                                md:w-auto sm:w-[10px]
                                " />
                        </TabList>
                    </div>
                </Box>
                <TabPanel value="1">
                    {clientSecret && (
                        <Elements options={options as StripeElementsOptions} stripe={stripePromise}>
                            {confirmed ? <CompletePage /> : <CheckoutForm dpmCheckerLink={dpmCheckerLink} />}
                        </Elements>
                    )}                
                </TabPanel>
                <TabPanel value="2">
                    <StarsTransactionComponent />
                </TabPanel>
            </TabContext>

        </div>
    );
}