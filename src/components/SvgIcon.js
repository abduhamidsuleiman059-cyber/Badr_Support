import React from 'react';
import Activity from 'lucide-react-native/icons/activity';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import BookOpen from 'lucide-react-native/icons/book-open';
import Check from 'lucide-react-native/icons/check';
import CheckCircle from 'lucide-react-native/icons/circle-check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Clock from 'lucide-react-native/icons/clock-3';
import Code from 'lucide-react-native/icons/code';
import Compass from 'lucide-react-native/icons/compass';
import Database from 'lucide-react-native/icons/database';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import File from 'lucide-react-native/icons/file';
import Grid from 'lucide-react-native/icons/grid-2x2';
import HardDrive from 'lucide-react-native/icons/hard-drive';
import Home from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import Layers from 'lucide-react-native/icons/layers';
import List from 'lucide-react-native/icons/list';
import Lock from 'lucide-react-native/icons/lock-keyhole';
import Mail from 'lucide-react-native/icons/mail';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import MessageSquare from 'lucide-react-native/icons/message-square';
import Mic from 'lucide-react-native/icons/mic';
import Minus from 'lucide-react-native/icons/minus';
import Monitor from 'lucide-react-native/icons/monitor';
import Moon from 'lucide-react-native/icons/moon';
import Orbit from 'lucide-react-native/icons/orbit';
import Paperclip from 'lucide-react-native/icons/paperclip';
import PenLine from 'lucide-react-native/icons/pen-line';
import Pin from 'lucide-react-native/icons/pin';
import PinOff from 'lucide-react-native/icons/pin-off';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings-2';
import Shield from 'lucide-react-native/icons/shield';
import Sliders from 'lucide-react-native/icons/sliders-horizontal';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sun from 'lucide-react-native/icons/sun';
import Trash from 'lucide-react-native/icons/trash-2';
import User from 'lucide-react-native/icons/user-round';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';

const icons = {
  activity: Activity,
  'align-left': List,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-right': ArrowUpRight,
  'book-open': BookOpen,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  clock: Clock,
  code: Code,
  compass: Compass,
  database: Database,
  'edit-3': PenLine,
  eye: Eye,
  'eye-off': EyeOff,
  file: File,
  grid: Grid,
  'hard-drive': HardDrive,
  home: Home,
  info: Info,
  layers: Layers,
  lock: Lock,
  mail: Mail,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  mic: Mic,
  minus: Minus,
  monitor: Monitor,
  moon: Moon,
  'more-horizontal': Ellipsis,
  orbit: Orbit,
  paperclip: Paperclip,
  pin: Pin,
  'pin-off': PinOff,
  play: Play,
  plus: Plus,
  search: Search,
  settings: Settings,
  shield: Shield,
  sliders: Sliders,
  sparkles: Sparkles,
  sun: Sun,
  trash: Trash,
  user: User,
  x: X,
  zap: Zap,
};

export default function SvgIcon({ name, size = 18, color = 'currentColor', strokeWidth = 2 }) {
  const Icon = icons[name] || Info;
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
