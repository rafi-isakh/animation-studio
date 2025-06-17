import { Dot } from 'lucide-react';
import React from 'react';
import styles from '@/styles/Tape.module.css';

const words = [
  'Performant',
  'Efficient',
  'Reliable',
  'Secure',
  'Scalable',
  'Maintainable',
  'Testable',
  'Modular',
  'Documented',
  'Collaborative',
];

const Tape = () => {
  return (
    <div className="z-50 overflow-x-clip pb-32 pt-10 lg:py-16">
      <div className="-mx-1 -rotate-3 bg-gradient-to-r from-orange-300 to-sky-400">
        <div className="flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className={`flex flex-none ${styles['animate-move-left']} gap-4 py-3 pr-4`} style={{ animationDuration: '30s' }}>
            {[...new Array(2)].fill(0).map((_, index) => (
              <React.Fragment key={index}>
                {words.map((word, wordIndex) => (
                  <div key={wordIndex} className="inline-flex items-center gap-4">
                    <span className="text-sm font-extrabold uppercase text-gray-900">
                      {word}
                    </span>
                    <Dot className="size-6 -rotate-12 text-gray-900" />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tape;