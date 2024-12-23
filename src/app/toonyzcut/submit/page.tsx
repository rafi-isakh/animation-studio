import { Button, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

export default function SubmitToonyzCutPage() {
    return (
        <div>
           <h1 className='text-[3.3rem] text-black dark:text-white mt-5'>투니즈컷 - 작품 등록 요청하기</h1>
            <p className='text-black dark:text-white'>투니즈컷에 작품을 등록하시면 크리에이터와 영상 제작사를 직접 연결해 드립니다.</p>
            
          <div className="flex flex-col gap-5 mt-10">
            <label htmlFor='title'>작품 제목</label>
            <input type="text" placeholder='작품 제목을 적어주세요.' name='title' />

            <label htmlFor='title'>이메일 주소</label>
            <input type="email" placeholder='연락 받으실 이메일을 적어주세요.' name='title' />

            <label htmlFor='title'>작품 링크</label>
            <input type="text" placeholder='작품의 상세 링크를 적어주세요.' name='title' />

            <label htmlFor='title'>연재 중인 플랫폼</label>
            <input type="text" placeholder='ex) 네이버, 카카오' name='title' />

            <label htmlFor='title'>장르 (최소 1개 이상)</label>
            <input type="text" placeholder='ex) 로맨스, 판타지' name='title' />

            <label htmlFor='title'>작품 표지 등록</label>
            <span>표지 이미지를 등록해 주세요.</span>
            <input type="file" name='title' />

            <label htmlFor='description'>작품 소개</label>
            <textarea placeholder='작품 소개를 적어주세요.' name='description' />
          </div>


        </div>
    )
}