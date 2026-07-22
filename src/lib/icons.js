import {
  FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock,
  Calendar, Activity, Image, Video, Music, Type, Cpu,
  Calculator, Code, TrendingUp, Wifi, Search, Zap, Shield,
  Globe, MousePointerClick, ChevronRight, ArrowRight,
  Sun, Moon, Menu, X, Star, Clock, CheckCircle2, Wrench,
  HelpCircle, Home, SlidersHorizontal
} from 'lucide-react'

export const ICON_MAP = {
  FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock,
  Calendar, Activity, Image, Video, Music, Type, Cpu,
  Calculator, Code, TrendingUp, Wifi, Search, Zap, Shield,
  Globe, MousePointerClick, ChevronRight, ArrowRight,
  Sun, Moon, Menu, X, Star, Clock, CheckCircle2, Wrench,
  HelpCircle, Home, SlidersHorizontal
}

export function getIcon(name) {
  return ICON_MAP[name] || FileText
}
