import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, Bell, Bold, Calendar1, CalendarClock, ChartNoAxesColumn, Check, ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, ClipboardList, ClipboardPaste, Clock, Code, Copy, Download, Eye, EyeOff, Filter, Heading, Heart, Image, Info, Italic, LayoutGrid, Lightbulb, Link, List, ListOrdered, MapIcon, Merge, MessageSquare, Minus, Monitor, Moon, MoreHorizontal, PackageOpen, Paperclip, Pencil, Pin, Plus, RefreshCcw, Search, Settings, Sigma, SquarePlay, Star, Sun, Tag, TicketX, Trash, Trash2, Triangle, User, X } from 'lucide-react';
import type { RefAttributes, SVGProps } from "react";

type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;
interface IconProps extends ElementAttributes {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
}

export const Icons = {
    Bell,
    ChartNoAxesColumn,
    Merge,
    ClipboardList,
    ClipboardPaste,
    Map: MapIcon,
    Lightbulb,
    TicketX,
    User,
    CalendarClock,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronRight,
    ArrowRight,
    ArrowUp,
    RefreshCcw,
    ArrowDown,
    ArrowUpDown,
    Minus,
    MessageSquare,
    Star,
    Eye,
    EyeOff,
    Heart,
    Pin,
    Search,
    Sigma,
    Sun,
    Moon,
    Monitor,
    X,
    Filter,
    Settings,
    Plus,
    Triangle,
    Copy,
    Check,
    Calendar1,
    Pencil,
    Trash,
    Trash2,
    Paperclip,
    Download,
    Clock,
    Tag,
    LayoutGrid,
    MoreHorizontal,
    PackageOpen,
    Info,
    Heading,
    Bold,
    Italic,
    List,
    ListOrdered,
    Code,
    Link,
    Image,
    SquarePlay,
    Google: ({ ...props }: IconProps) => (
        <svg
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            {...props}
        >
            <path
                d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z"
            />
        </svg>
    ),
}