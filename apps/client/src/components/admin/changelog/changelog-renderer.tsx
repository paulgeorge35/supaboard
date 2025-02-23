import { cn } from "@/lib/utils"

import { Badge } from "@/components/badge"
import { DateTime } from "luxon"

type Changelog = {
    changelog: {
        title: string
        description: string
        tags: ('NEW' | 'IMPROVED' | 'FIXED')[]
        labels?: {
            id: string
            name: string
        }[]
    },
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
    publishedAt: Date | null,
    preview?: boolean,
    slug?: string
}

export const ChangelogContent = ({ changelog, status, publishedAt, preview, slug }: Changelog): React.ReactNode => {
    // Split content into lines while preserving empty lines
    const lines = changelog.description?.split('\n') ?? [];
    let result: React.ReactNode[] = [];
    result.push(
        <div key='changelog-header' className="vertical gap-2">
            {!preview && <p className='text-sm font-light text-gray-500 dark:text-zinc-500'>
                {status === 'DRAFT' ? 'Unpublished'
                    : status === 'PUBLISHED' && publishedAt ? DateTime.fromJSDate(new Date(publishedAt)).toRelative()
                        : <Badge label='Scheduled' className='border-amber-500 text-amber-500 bg-amber-500/10' />
                }
            </p>}
            <span className='horizontal gap-2 flex-wrap'>
                {status === 'DRAFT' && <Badge label='Draft' className='border-amber-500 text-amber-500 bg-amber-500/10' />}
                {changelog.tags.includes('NEW') && <Badge label='New' className='border-green-500 text-green-500 bg-green-500/10' />}
                {changelog.tags.includes('IMPROVED') && <Badge label='Improved' className='border-blue-500 text-blue-500 bg-blue-500/10' />}
                {changelog.tags.includes('FIXED') && <Badge label='Fixed' className='border-red-500 text-red-500 bg-red-500/10' />}
                {changelog.labels?.map(label => (
                    <Badge key={label.id} label={label.name} className='border-gray-500 text-gray-500 bg-gray-500/10' />
                ))}
            </span>
            <h1
                className={cn('text-2xl font-bold', {
                    'text-gray-500 dark:text-zinc-500': changelog.title === ''
                })}
            >
                {changelog.title === '' ? 'Enter a title' : changelog.title}
            </h1>
        </div>
    )

    let currentOrderedList: React.ReactNode[] = [];
    let currentUnorderedList: React.ReactNode[] = [];

    const flushList = () => {
        if (currentOrderedList.length > 0) {
            result.push(
                <ol key={`ol-${result.length}`} className="list-decimal list-inside mb-4 pl-4">
                    {currentOrderedList}
                </ol>
            );
            currentOrderedList = [];
        }
        if (currentUnorderedList.length > 0) {
            result.push(
                <ul key={`ul-${result.length}`} className="list-disc list-inside mb-4 pl-4">
                    {currentUnorderedList}
                </ul>
            );
            currentUnorderedList = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Handle empty lines
        if (trimmedLine === '') {
            flushList();
            result.push(<br key={`br-${index}`} />);
            return;
        }

        // Handle image tags [image][label][url]
        const imageMatch = line.match(/^\[image\]\[(.*?)\]\[(.*?)\]$/);
        if (imageMatch) {
            flushList();
            const [_, label, url] = imageMatch;

            result.push(
                <figure key={`image-${index}`} className="my-4">
                    {url === 'Insert image URL here' ? (
                        <div className="w-full aspect-video rounded-lg border bg-zinc-100 dark:bg-zinc-800/30 flex items-center justify-center">
                            <p className="text-sm text-gray-500">Paste an image URL here</p>
                        </div>
                    ) : (
                        <img
                            src={url}
                            alt={label || 'Changelog image'}
                            className="rounded-lg border max-h-[500px] object-contain bg-zinc-100 dark:bg-zinc-800/30"
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = 'none';
                                const div = document.createElement('div');
                                div.className = 'w-full aspect-video rounded-lg border bg-zinc-100 dark:bg-zinc-800/30 flex items-center justify-center';
                                const p = document.createElement('p');
                                p.className = 'text-sm text-gray-500';
                                p.textContent = 'Invalid image URL';
                                div.appendChild(p);
                                img.parentNode?.insertBefore(div, img);
                            }}
                        />
                    )}
                    {label && <figcaption className="text-sm text-gray-500 mt-2">{label}</figcaption>}
                </figure>
            );
            return;
        }

        // Handle video tags [video][label][url]
        const videoMatch = line.match(/^\[video\]\[(.*?)\]\[(.*?)\]$/);
        if (videoMatch) {
            flushList();
            const [_, label, url] = videoMatch;

            if (isYouTubeUrl(url)) {
                const embedUrl = transformYouTubeUrl(url);
                result.push(
                    <div key={`video-${index}`} className="my-4">
                        {label && <p className="text-sm text-gray-500 mb-2">{label}</p>}
                        <iframe
                            className="w-full aspect-video rounded-lg border"
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            } else {
                // Show placeholder when URL is not a valid YouTube URL
                result.push(
                    <div key={`video-${index}`} className="my-4">
                        {label && <p className="text-sm text-gray-500 mb-2">{label}</p>}
                        <div className="w-full aspect-video rounded-lg border bg-zinc-100 dark:bg-zinc-800/30 flex items-center justify-center">
                            <p className="text-sm text-gray-500">
                                {url === 'Insert YouTube video URL here'
                                    ? 'Paste a YouTube URL here'
                                    : 'Invalid YouTube URL'}
                            </p>
                        </div>
                    </div>
                );
            }
            return;
        }

        // Handle headings (# )
        if (line.startsWith('# ')) {
            flushList();
            result.push(
                <h1 key={`h1-${index}`} className="text-lg font-bold mb-4">
                    {parseLine(line.slice(2))}
                </h1>
            );
            return;
        }

        // Handle ordered lists (1. , 2. , etc)
        if (/^\d+\.\s/.test(line)) {
            if (currentUnorderedList.length > 0) flushList();
            currentOrderedList.push(
                <li key={`li-${index}`}>{parseLine(line.replace(/^\d+\.\s/, ''))}</li>
            );
            return;
        }

        // Handle unordered lists (- )
        if (line.startsWith('- ')) {
            if (currentOrderedList.length > 0) flushList();
            currentUnorderedList.push(
                <li key={`li-${index}`}>{parseLine(line.slice(2))}</li>
            );
            return;
        }

        // Handle regular text lines
        flushList();
        result.push(
            <p key={`p-${index}`} className="mb-4">
                {parseLine(line)}
            </p>
        );
    });

    // Flush any remaining lists
    flushList();

    if (preview) {
        return (
            <div className="text-sm [&>*]:text-zinc-700 dark:[&>*]:text-zinc-300">
                <div className="relative">
                    <div className="max-h-[400px] overflow-hidden">
                        {result}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    }

    return (
        <div className="text-sm [&>*]:text-zinc-700 dark:[&>*]:text-zinc-300">
            {result}
        </div>
    );
};

const isYouTubeUrl = (url: string): boolean => {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
    ]
    return patterns.some(pattern => pattern.test(url))
}

const transformYouTubeUrl = (url: string): string => {
    // Handle different YouTube URL formats
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`
        }
    }

    return url
}

const parseLine = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
        // Handle strong (**text**)
        if (text.slice(i, i + 2) === '**' && text.slice(i + 2).includes('**')) {
            if (currentText) {
                parts.push(currentText);
                currentText = '';
            }
            const endIndex = text.indexOf('**', i + 2);
            parts.push(<strong key={`strong-${i}`}>{parseLine(text.slice(i + 2, endIndex))}</strong>);
            i = endIndex + 2;
            continue;
        }

        // Handle emphasis (*text*)
        if (text[i] === '*' && !text.slice(i - 1, i).includes('*') && text.slice(i + 1).includes('*')) {
            if (currentText) {
                parts.push(currentText);
                currentText = '';
            }
            const endIndex = text.indexOf('*', i + 1);
            parts.push(<em key={`em-${i}`}>{parseLine(text.slice(i + 1, endIndex))}</em>);
            i = endIndex + 1;
            continue;
        }

        // Handle code (`text`)
        if (text[i] === '`' && text.slice(i + 1).includes('`')) {
            if (currentText) {
                parts.push(currentText);
                currentText = '';
            }
            const endIndex = text.indexOf('`', i + 1);
            parts.push(
                <code key={`code-${i}`} className="px-1.5 py-0.5 text-gray-900 dark:text-zinc-50 bg-gray-100 dark:bg-zinc-800 rounded font-mono text-sm">
                    {text.slice(i + 1, endIndex)}
                </code>
            );
            i = endIndex + 1;
            continue;
        }

        // Handle links ([text](url))
        if (text[i] === '[' && text.slice(i).includes('](') && text.slice(i).includes(')')) {
            if (currentText) {
                parts.push(currentText);
                currentText = '';
            }
            const textEnd = text.indexOf('](', i);
            const linkEnd = text.indexOf(')', textEnd);
            const linkText = text.slice(i + 1, textEnd);
            const linkUrl = text.slice(textEnd + 2, linkEnd);
            parts.push(
                <a key={`link-${i}`} href={linkUrl} className="text-blue-500 hover:underline">
                    {linkText}
                </a>
            );
            i = linkEnd + 1;
            continue;
        }

        currentText += text[i];
        i++;
    }

    if (currentText) {
        parts.push(currentText);
    }

    return parts;
};