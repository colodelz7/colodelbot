import { useState, useEffect } from 'react';
import './style.css';

import { useSettings } from './hooks/useSettings';
import { useMemories } from './hooks/useMemories';
import { useConversations } from './hooks/useConversations';
import { useRobot } from './hooks/useRobot';
import { useToasts } from './hooks/useToasts';
import { useChat } from './hooks/useChat';

import ParticleField from './components/ParticleField';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import RobotPanel from './components/RobotPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import ToastStack from './components/ToastStack';

export default function App() {
  const [settings, updateSettings] = useSettings();
  const memories = useMemories();
  const conv = useConversations();
  const robot = useRobot(settings.soundOn);
  const { toasts, mostrarToast } = useToasts();
  const chat = useChat({ conv, robot, memories, settings, mostrarToast });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarMobileOpen);
  }, [sidebarMobileOpen]);

  const mediaMobile = window.matchMedia('(max-width: 900px)');

  function onToggleSidebar() {
    if (mediaMobile.matches) setSidebarMobileOpen((o) => !o);
    else setSidebarCollapsed((c) => !c);
  }

  const conversa = conv.conversaAtiva();

  return (
    <>
      <ParticleField />

      <Topbar
        theme={settings.theme}
        onToggleTheme={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
        statusTexto={robot.statusTexto}
        busy={robot.busy}
      />

      <div className="shell">
        <Sidebar conv={conv} onToast={mostrarToast} />
        <div className="sidebar-backdrop" onClick={() => setSidebarMobileOpen(false)}></div>

        <main className="console">
          <RobotPanel robot={robot} hudSession={conversa.id.slice(0, 6).toUpperCase()} hudMessages={conversa.messages.length} />
          <ChatPanel
            conversa={conversa}
            chat={chat}
            onToast={mostrarToast}
            onResetSono={robot.resetarTimerSono}
          />
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        memories={memories}
      />

      <ToastStack toasts={toasts} />
    </>
  );
}
