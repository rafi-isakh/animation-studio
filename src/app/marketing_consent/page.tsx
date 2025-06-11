"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { Button } from '@/components/shadcnUI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcnUI/Card';
import { Checkbox } from '@/components/shadcnUI/Checkbox';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Mail, Gift } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import DictionaryPhrase from '@/components/DictionaryPhrase';

export default function MarketingConsentPage() {
    const [hasAgreed, setHasAgreed] = useState(false);
    const [showPromoCode, setShowPromoCode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { language, dictionary } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const {bio, nickname, genres} = useUser();
    const {isLoggedIn} = useAuth();

    const handleAgree = async () => {
        if (!isLoggedIn) {
            router.push('/signin_marketing');
            return;
        }
        if (!hasAgreed) {
            toast({
                title: phrase(dictionary, 'marketing_please_agree_title', language),
                description: phrase(dictionary, 'marketing_checkbox_required', language),
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('marketing', 'true');
            formData.append('bio', bio);
            formData.append('nickname', nickname);
            formData.append('genres', JSON.stringify(genres));

            const response = await fetch('/api/update_user', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to update marketing consent');
            }

            setShowPromoCode(true);
            toast({
                title: phrase(dictionary, 'marketing_update_success', language),
                description: phrase(dictionary, 'marketing_preferences_updated', language),
            });

        } catch (error) {
            console.error('Error updating marketing consent:', error);
            toast({
                title: phrase(dictionary, 'marketing_update_error', language),
                description: phrase(dictionary, 'marketing_update_failed', language),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    const handleCopyPromoCode = async () => {
        try {
            await navigator.clipboard.writeText('WELCOME25');
            toast({
                title: phrase(dictionary, 'marketing_copied_title', language),
                description: phrase(dictionary, 'marketing_promo_copied', language),
            });
        } catch (error) {
            console.error('Failed to copy promo code:', error);
        }
    };

    const handleContinue = () => {
        router.push('/');
    };

    if (showPromoCode) {
        return (
            <div className="relative w-full flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <div className="flex flex-col items-center justify-center max-w-md w-full py-4">
                    <div className="relative flex h-28 w-28 mb-6">
                        <Image 
                            src="/images/stelli_head.svg" 
                            alt="Stelli image" 
                            width={100} 
                            height={100} 
                            className="self-center mx-auto" 
                        />
                    </div>
                    
                    <Card className="w-full">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-600">
                                <DictionaryPhrase phraseVar="marketing_thank_you" />
                            </CardTitle>
                            <CardDescription>
                                <DictionaryPhrase phraseVar="marketing_all_set" />
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="text-center space-y-6">
                            <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-lg border-2 border-dashed border-pink-300 dark:border-pink-700">
                                <div className="flex justify-center mb-3">
                                    <Gift className="h-8 w-8 text-pink-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-pink-800 dark:text-pink-200 mb-2">
                                    <DictionaryPhrase phraseVar="marketing_welcome_gift" />
                                </h3>
                                <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-pink-200 dark:border-pink-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <DictionaryPhrase phraseVar="marketing_promo_code_label" />
                                    </p>
                                    <div className="flex items-center justify-center space-x-2">
                                        <code className="text-2xl font-bold text-pink-600 dark:text-pink-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                                            WELCOME25
                                        </code>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={handleCopyPromoCode}
                                            className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                                    <DictionaryPhrase phraseVar="marketing_promo_description" />
                                </p>
                            </div>
                            
                            <div className="flex flex-col space-y-3">
                                <Button 
                                    onClick={() => router.push('/stars/redeem')} 
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                    <DictionaryPhrase phraseVar="redeem_now" />
                                </Button>
                                <Button 
                                    onClick={handleContinue} 
                                    variant="outline"
                                    className="w-full"
                                >
                                    <DictionaryPhrase phraseVar="marketing_continue_toonyz" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-4">
            <div className="flex flex-col items-center justify-center max-w-md w-full py-4">
                <div className="relative flex h-28 w-28 mb-6">
                    <Image 
                        src="/images/stelli_head.svg" 
                        alt="Stelli image" 
                        width={100} 
                        height={100} 
                        className="self-center mx-auto" 
                    />
                </div>
                
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">
                            <DictionaryPhrase phraseVar="marketing_stay_in_loop" />
                        </CardTitle>
                        <CardDescription>
                            <DictionaryPhrase phraseVar="marketing_get_updates" />
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <Mail className="h-16 w-16 text-pink-600" />
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">
                                    <DictionaryPhrase phraseVar="marketing_what_receive" />
                                </h3>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• <DictionaryPhrase phraseVar="marketing_chapter_notifications" /></li>
                                    <li>• <DictionaryPhrase phraseVar="marketing_exclusive_discounts" /></li>
                                    <li>• <DictionaryPhrase phraseVar="marketing_author_updates" /></li>
                                    <li>• <DictionaryPhrase phraseVar="marketing_early_access" /></li>
                                </ul>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 border rounded-lg">
                                <Checkbox
                                    id="marketing-consent"
                                    checked={hasAgreed}
                                    onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
                                    className="mt-1"
                                />
                                <label 
                                    htmlFor="marketing-consent" 
                                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed"
                                >
                                    <DictionaryPhrase phraseVar="marketing_consent_text" />
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                            <Button 
                                onClick={handleAgree} 
                                disabled={isLoading}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                            >
                                {isLoading ? <DictionaryPhrase phraseVar="marketing_processing" /> : <DictionaryPhrase phraseVar="marketing_sign_me_up" />}
                            </Button>
                            <Button 
                                onClick={handleSkip} 
                                variant="ghost" 
                                className="w-full text-gray-500 hover:text-gray-700"
                            >
                                <DictionaryPhrase phraseVar="marketing_skip_for_now" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
