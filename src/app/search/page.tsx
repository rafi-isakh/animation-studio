"use client"

import {useState, useEffect} from 'react';
const Search = () => {

    const [data, setData] = useState(null);

    useEffect(() => {
        const storedData = localStorage.getItem('searchData');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

  return (
    <div>
      {JSON.stringify(data)}
    </div>
  );
};

export default Search;