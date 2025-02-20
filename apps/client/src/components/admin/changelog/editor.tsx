import { Button, Icons } from "@/components"
import { Input } from "@/components/input"
import { fetchClient } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"

type ChangelogEditorProps = {
    title: string
    onChangeTitle: (title: string) => void
    content: string
    onChangeContent: (content: string) => void
}

export const ChangelogEditor = ({ title, onChangeTitle, content, onChangeContent }: ChangelogEditorProps) => {
    const ref = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const uploadFile = async (url: string, key: string, file: File) => {
        const response = await fetch(url, {
            method: 'PUT',
            body: file,
        });
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        return `${import.meta.env.VITE_R2_PUBLIC_ENDPOINT}/${key}`;
    };

    const { mutateAsync: generateUploadUrl } = useMutation({
        mutationFn: async (key: string) => await fetchClient(`storage/${key}/write`, {
            method: 'PUT',
        }),
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            // Generate a unique key for the file
            const fileExtension = file.name.split('.').pop()
            const key = `changelog/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

            // Get upload URL
            const { url } = await generateUploadUrl(key)

            // Upload file
            const fileUrl = await uploadFile(url, key, file)

            // Insert image tag at cursor position or replace selection
            const textarea = ref.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const beforeText = textarea.value.substring(0, start)
            const afterText = textarea.value.substring(end)

            // Create image tag with file name as label
            const imageTag = `[image][${file.name}][${fileUrl}]`
            const newText = `${beforeText}${imageTag}${afterText}`

            // Update content
            onChangeContent(newText)

            // Reset file input
            e.target.value = ''

        } catch (error) {
            console.error('Failed to upload image:', error)
            // You might want to show an error toast here
        }
    }

    const handleActionClick = (action: 'heading' | 'bold' | 'italic' | 'list' | 'list-ordered' | 'link' | 'code' | 'image' | 'video') => {
        if (action === 'image') {
            fileInputRef.current?.click()
            return
        }

        const textarea = ref.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = textarea.value.substring(start, end)
        const beforeText = textarea.value.substring(0, start)
        const afterText = textarea.value.substring(end)

        let newText = ''
        let newCursorPosition = start

        switch (action) {
            case 'heading':
                // If at start of line or after newline, add #
                const isStartOfLine = start === 0 || textarea.value[start - 1] === '\n'
                if (isStartOfLine) {
                    newText = `${beforeText}# ${selectedText}${afterText}`
                    newCursorPosition = start + 2 + selectedText.length
                } else {
                    // Move to start of line and add #
                    const lineStart = beforeText.lastIndexOf('\n') + 1
                    newText = `${textarea.value.substring(0, lineStart)}# ${textarea.value.substring(lineStart)}`
                    newCursorPosition = lineStart + 2
                }
                break

            case 'bold':
                newText = `${beforeText}**${selectedText}**${afterText}`
                newCursorPosition = start + 2 + (selectedText.length || 0)
                break

            case 'italic':
                newText = `${beforeText}*${selectedText}*${afterText}`
                newCursorPosition = start + 1 + (selectedText.length || 0)
                break

            case 'list':
            case 'list-ordered': {
                // If no selection, just add a single list item
                if (start === end) {
                    const prefix = action === 'list' ? '- ' : '1. '
                    newText = `${beforeText}${prefix}${afterText}`
                    newCursorPosition = start + prefix.length
                    break
                }

                // Get the full lines containing the selection
                const lastNewlineBeforeSelection = beforeText.lastIndexOf('\n') + 1
                const firstNewlineAfterSelection = afterText.indexOf('\n')
                const fullBeforeText = textarea.value.substring(0, lastNewlineBeforeSelection)
                const fullAfterText = firstNewlineAfterSelection === -1 
                    ? '' 
                    : afterText.substring(firstNewlineAfterSelection)
                
                // Get all the lines in the selection
                const textToFormat = textarea.value.substring(
                    lastNewlineBeforeSelection,
                    firstNewlineAfterSelection === -1 
                        ? textarea.value.length 
                        : end + firstNewlineAfterSelection
                )

                // Format each line
                const formattedLines = textToFormat
                    .split('\n')
                    .map((line, index) => {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) return ''
                        
                        // Remove existing list markers if any
                        const cleanLine = trimmedLine
                            .replace(/^(\d+\.\s+)/, '')  // Remove ordered list marker
                            .replace(/^(-\s+)/, '')      // Remove unordered list marker
                        
                        return action === 'list'
                            ? `- ${cleanLine}`
                            : `${index + 1}. ${cleanLine}`
                    })
                    .join('\n')

                newText = `${fullBeforeText}${formattedLines}${fullAfterText}`
                newCursorPosition = fullBeforeText.length + formattedLines.length
                break
            }

            case 'code': {
                // For code, we'll wrap the selected text in backticks
                newText = `${beforeText}\`${selectedText}\`${afterText}`
                newCursorPosition = start + 1 + (selectedText.length || 0)
                break
            }

            case 'link': {
                if (!selectedText) {
                    // If no selection, insert placeholder and select the "url" text
                    newText = `${beforeText}[](url)${afterText}`
                    const urlStart = start + 3 // Position after "[](""
                    newCursorPosition = urlStart
                    
                    // Update content first
                    onChangeContent(newText)
                    
                    // Select the "url" text
                    requestAnimationFrame(() => {
                        textarea.focus()
                        textarea.setSelectionRange(urlStart, urlStart + 3) // "url" is 3 chars long
                    })
                    return // Early return to avoid the default cursor positioning
                } else {
                    // If text is selected, use it as link text and add placeholder URL
                    newText = `${beforeText}[${selectedText}](url)${afterText}`
                    const urlStart = start + selectedText.length + 3 // Position after "[selected](""
                    newCursorPosition = urlStart
                    
                    // Update content first
                    onChangeContent(newText)
                    
                    // Select the "url" text
                    requestAnimationFrame(() => {
                        textarea.focus()
                        textarea.setSelectionRange(urlStart, urlStart + 3) // "url" is 3 chars long
                    })
                    return // Early return to avoid the default cursor positioning
                }
            }

            case 'video': {
                const youtubeUrlPlaceholder = 'Insert YouTube video URL here'
                
                if (!selectedText) {
                    // If no selection, insert empty label and URL placeholder
                    newText = `${beforeText}[video][][${youtubeUrlPlaceholder}]${afterText}`
                    const labelStart = start + 7 // Position after "[video]["
                    
                    // Update content first
                    onChangeContent(newText)
                    
                    // Place cursor at label position
                    requestAnimationFrame(() => {
                        textarea.focus()
                        textarea.setSelectionRange(labelStart+1, labelStart+1)
                    })
                    return
                } else {
                    // If text is selected, use it as label and add URL placeholder
                    newText = `${beforeText}[video][${selectedText}][${youtubeUrlPlaceholder}]${afterText}`
                    const urlStart = start + selectedText.length + 9 // Position after "[video][label]["
                    
                    // Update content first
                    onChangeContent(newText)
                    
                    // Select the URL placeholder
                    requestAnimationFrame(() => {
                        textarea.focus()
                        textarea.setSelectionRange(urlStart, urlStart + youtubeUrlPlaceholder.length)
                    })
                    return
                }
            }
        }

        // Update content
        onChangeContent(newText)

        // Restore focus and set cursor position
        requestAnimationFrame(() => {
            textarea.focus()
            if (selectedText && action !== 'list' && action !== 'list-ordered') {
                const formatOffset = {
                    heading: 2,
                    bold: 2,
                    italic: 1,
                    code: 1,
                    link: 1
                }[action] ?? 0

                // For non-list actions, maintain selection with formatting
                textarea.setSelectionRange(
                    start + formatOffset,
                    end + formatOffset
                )
            } else {
                // For lists or no selection, place cursor at the end of the formatted text
                textarea.setSelectionRange(newCursorPosition, newCursorPosition)
            }
        })
    }

    return (
        <div className="vertical gap-4 p-4 h-full">
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <Input
                placeholder="Enter a title"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                className="border-none h-auto"
                inputClassName="md:!text-2xl !font-bold"
            />
            <hr />
            <div className="vertical h-full">
                <div className="rounded-t-md horizontal p-2 center-v gap-2 border border-b-0 bg-zinc-100 dark:bg-zinc-800/30">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('heading')}
                    >
                        <Icons.Heading className="size-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('bold')}
                    >
                        <Icons.Bold className="size-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('italic')}
                    >
                        <Icons.Italic className="size-4" />
                    </Button>
                    <div  className="h-4 border-l"/>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('list')}
                    >
                        <Icons.List className="size-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('list-ordered')}
                    >
                        <Icons.ListOrdered className="size-4" />
                    </Button>
                    <div  className="h-4 border-l"/>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('link')}
                    >
                        <Icons.Link className="size-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('code')}
                    >
                        <Icons.Code className="size-4" />
                    </Button>
                    <div  className="h-4 border-l"/>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('image')}
                    >
                        <Icons.Image className="size-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={() => handleActionClick('video')}
                    >
                        <Icons.SquarePlay className="size-4" />
                    </Button>
                    </div>
                <textarea
                    ref={ref}
                    value={content}
                    onChange={(e) => onChangeContent(e.target.value)}
                    className='w-full h-full border rounded-b-md p-4 resize-none'
                />
            </div>
        </div>
    )
}