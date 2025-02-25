import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface CommentContentProps {
    content: string | undefined
    className?: string
    mention?: string
}

export const CommentContent = ({ content, className, mention }: CommentContentProps): ReactNode => {
    if (!content) return null

    // Split content into lines while preserving empty lines
    const lines = content.split('\n')
    const result: ReactNode[] = []

    let currentOrderedList: ReactNode[] = []
    let currentUnorderedList: ReactNode[] = []

    const flushList = () => {
        if (currentOrderedList.length > 0) {
            result.push(
                <ol key={`ol-${result.length}`} className="list-decimal list-inside pl-4">
                    {currentOrderedList}
                </ol>
            )
            currentOrderedList = []
        }
        if (currentUnorderedList.length > 0) {
            result.push(
                <ul key={`ul-${result.length}`} className="list-disc list-inside pl-4">
                    {currentUnorderedList}
                </ul>
            )
            currentUnorderedList = []
        }
    }

    lines.forEach((line, index) => {
        const trimmedLine = line.trim()

        // Handle empty lines
        if (trimmedLine === '') {
            flushList()
            result.push(<br key={`br-${index}`} />)
            return
        }

        // Handle ordered lists (1. , 2. , etc)
        if (/^\d+\.\s/.test(line)) {
            if (currentUnorderedList.length > 0) flushList()
            currentOrderedList.push(
                <li key={`li-${index}`}>{parseLine(line.replace(/^\d+\.\s/, ''), mention)}</li>
            )
            return
        }

        // Handle unordered lists (- )
        if (line.startsWith('- ')) {
            if (currentOrderedList.length > 0) flushList()
            currentUnorderedList.push(
                <li key={`li-${index}`}>{parseLine(line.slice(2), mention)}</li>
            )
            return
        }

        // Handle regular text lines
        flushList()
        result.push(
            <p key={`p-${index}`} className='whitespace-pre-wrap'>
                {parseLine(line, mention)}
            </p>
        )
    })

    // Flush any remaining lists
    flushList()

    return (
        <div className={cn("text-sm [&>*]:text-zinc-700 dark:[&>*]:text-zinc-300", className)}>
            {result}
        </div>
    )
}

const parseLine = (text: string, mention?: string): ReactNode[] => {
    // Handle mention at the start of the line
    if (mention && text.startsWith(` ${mention} `)) {
        const mentionText = ` ${mention} `
        const remainingText = text.slice(mentionText.length)
        return [
            <span key="mention" className="bg-[var(--color-primary)]/10 !text-[var(--color-primary)] rounded-sm">
                {mentionText}
            </span>,
            ...parseTextFormatting(remainingText)
        ]
    }

    return parseTextFormatting(text)
}

const parseTextFormatting = (text: string): ReactNode[] => {
    const parts: ReactNode[] = []
    let currentText = ''
    let i = 0

    while (i < text.length) {
        // Handle strong (**text**)
        if (text.slice(i, i + 2) === '**' && text.slice(i + 2).includes('**')) {
            if (currentText) {
                parts.push(currentText)
                currentText = ''
            }
            const endIndex = text.indexOf('**', i + 2)
            parts.push(<strong key={`strong-${i}`}>{parseTextFormatting(text.slice(i + 2, endIndex))}</strong>)
            i = endIndex + 2
            continue
        }

        // Handle emphasis (*text*)
        if (text[i] === '*' && !text.slice(i - 1, i).includes('*') && text.slice(i + 1).includes('*')) {
            if (currentText) {
                parts.push(currentText)
                currentText = ''
            }
            const endIndex = text.indexOf('*', i + 1)
            parts.push(<em key={`em-${i}`}>{parseTextFormatting(text.slice(i + 1, endIndex))}</em>)
            i = endIndex + 1
            continue
        }

        // Handle code (`text`)
        if (text[i] === '`' && text.slice(i + 1).includes('`')) {
            if (currentText) {
                parts.push(currentText)
                currentText = ''
            }
            const endIndex = text.indexOf('`', i + 1)
            parts.push(
                <code key={`code-${i}`} className="px-1.5 py-0.5 text-gray-900 dark:text-zinc-50 bg-gray-100 dark:bg-zinc-800 rounded font-mono text-sm">
                    {text.slice(i + 1, endIndex)}
                </code>
            )
            i = endIndex + 1
            continue
        }

        currentText += text[i]
        i++
    }

    if (currentText) {
        parts.push(currentText)
    }

    return parts
}
