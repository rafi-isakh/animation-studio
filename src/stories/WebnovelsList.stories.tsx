import '@/styles/globals.css';
import WebnovelsList from "@/stories/WebnovelsList";
import type { Meta, StoryObj, StoryFn } from '@storybook/react';

const meta = {
    title: "WebnovelsList",
    component: WebnovelsList,
    args: {
        items: []
    }
} satisfies Meta<typeof WebnovelsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
args: {
    items: [
        {
            id: 1,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 1',
            description: 'Description 1',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 4,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 5,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 6,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 7,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 8,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 9,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 10,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 11,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 12,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 13,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 14,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
        {
            id: 15,
            image: 'https://images.unsplash.com/photo-1731978008284-8a52ba9b8931?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            title: 'Webnovel 2',
            description: 'Description 2',
            episode: 'Episode 4 Free',
            score: 4.9,
            scoreCount: 3600,
        },
       ]
    }
}       

    