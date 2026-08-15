import {
  FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Unlock,
  Calendar, Activity, Image, Video, Music, Type, Cpu,
  Calculator, Code, TrendingUp, Wifi, Search, Zap, Shield,
  Globe, MousePointerClick, ChevronRight, ChevronDown, ArrowRight,
  Sun, Moon, Menu, X, Star, Clock, CheckCircle2, Wrench,
  HelpCircle, Home, SlidersHorizontal, FileImage, Files, Scissors,
  RotateCw, Crop, Repeat, Stamp, Film, Volume2, Mic,
  CaseSensitive, ListFilter, GitCompare, PenLine, FileSearch,
  Languages, RefreshCw, SpellCheck, Percent, Banknote, DollarSign,
  Braces, CheckSquare, Link, Unlink, Palette, Tag, Map,
  Server, Hash, Camera, Timer, ListChecks, StickyNote,
  Shuffle, Ruler, Scale, Thermometer, Gauge, QrCode,
  Monitor, Table, FileOutput,
  Grid3x3, Eraser, EyeOff, Contrast,
  Radio, Layers, ScanLine, Pipette, IdCard, Target, Printer,
  Sparkles, Replace, LayoutGrid, ImagePlus, ZoomIn, Ratio,
} from 'lucide-react'

export const ICON_MAP = {
  FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Unlock,
  Calendar, Activity, Image, Video, Music, Type, Cpu,
  Calculator, Code, TrendingUp, Wifi, Search, Zap, Shield,
  Globe, MousePointerClick, ChevronRight, ChevronDown, ArrowRight,
  Sun, Moon, Menu, X, Star, Clock, CheckCircle2, Wrench,
  HelpCircle, Home, SlidersHorizontal, FileImage, Files, Scissors,
  RotateCw, Crop, Repeat, Stamp, Film, Volume2, Mic,
  CaseSensitive, ListFilter, GitCompare, PenLine, FileSearch,
  Languages, RefreshCw, SpellCheck, Percent, Banknote, DollarSign,
  Braces, CheckSquare, Link, Unlink, Palette, Tag, Map,
  Server, Hash, Camera, Timer, ListChecks, StickyNote,
  Shuffle, Ruler, Scale, Thermometer, Gauge, QrCode,
  Monitor, Table, FileOutput,
  Grid3x3, Eraser, EyeOff,
  FileConvert: FileOutput,
  Grid3X3: Grid3x3,
  Radio, Layers, ScanLine, Pipette, IdCard, Target, Printer,
  Sparkles, Replace, LayoutGrid, ImagePlus, ZoomIn, Ratio,
}

export function getIcon(name) {
  return ICON_MAP[name] || FileText
}
