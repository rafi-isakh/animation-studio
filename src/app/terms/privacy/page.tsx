import { replaceSmartQuotes } from '@/utils/font';
import {terms_privacy} from '@/utils/terms';

export default function Terms() {
    return <div className='max-w-screen-md mx-auto p-4 whitespace-pre-wrap'>{replaceSmartQuotes(terms_privacy)}</div>
}
