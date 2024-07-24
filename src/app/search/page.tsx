"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {phrase} from '@/utils/phrases';

const Search = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const query = searchParams.query;
  const { dictionary, language } = useLanguage();

  if (typeof query === 'string') {
  } else if (Array.isArray(query)) {
      throw new Error("there should be only one query param")
  } else {
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/search?query=${query}`)
      .then(r => r.json())
      .then(r => setWebnovels(r));
  }, [query]);

  return (
    <div>
      <center>
        {
          (webnovels.length) ?
            webnovels.map((webnovel, index) => (
              <WebnovelComponent key={index} webnovel={webnovel} />
            )) :
            <main>{phrase(dictionary, "noSearchResults", language)}</main>
        }
      </center>
    </div>
  );
};

export default Search;