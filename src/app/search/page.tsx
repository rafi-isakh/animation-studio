"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import {useState, useEffect} from 'react';
const Search = () => {

    const [data, setData] = useState<Webnovel>();

    useEffect(() => {
        const storedData = sessionStorage.getItem('searchData');
        if (storedData) {
            setData(JSON.parse(storedData));
        } else {
          setData(null);
        }
    }, [data]);

  return (
    <div>
      <center>
        {
          data?
          <WebnovelComponent webnovel={data}/>
        : <main></main>
        }
      </center>
    </div>
  );
};

export default Search;