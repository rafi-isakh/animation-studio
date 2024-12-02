"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {phrase} from '@/utils/phrases';

const Search = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const query = searchParams.query;
  const remember = searchParams.remember;
  const { dictionary, language } = useLanguage();

  if (typeof query === 'string') {
  } else if (Array.isArray(query)) {
      throw new Error("there should be only one query param")
  } else {
  }

  useEffect(() => {
    fetch(`/api/search?query=${query}&remember=${remember}`) // searches and saves query if user is logged in
      .then(r => r.json())
      .then(r => setWebnovels(r));
  }, [query]);

  return (
    <div>
      <center>
        {
          (webnovels.length) ?
            webnovels.map((webnovel, index) => (
              <WebnovelComponent key={index} webnovel={webnovel} ranking={false} index={index} chunkIndex={0} />
            )) :
            <main>{phrase(dictionary, "noSearchResults", language)}</main>
        }
      </center>
    </div>
  );
};

export default Search;