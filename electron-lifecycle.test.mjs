import fs from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(projectRoot, 'main.cjs'), 'utf8');

describe('Electron tray lifecycle contract', () => {
  it('creates one tray with Open and Exit actions', () => {
    expect(mainSource).toContain('if (tray) return;');
    expect(mainSource).toContain('function getTrayIconPath()');
    expect(mainSource).toContain('tray = new Tray(getTrayIconPath());');
    expect(mainSource).toContain("label: 'Open XMSGi'");
    expect(mainSource).toContain("label: 'Exit'");
    expect(mainSource).toContain("tray.on('double-click', showMainWindow)");
  });

  it('hides the window on close while preserving the Telegram lifecycle', () => {
    const closeHandlerMatch = mainSource.match(
      /mainWindow\.on\('close',\s*(\(event\)\s*=>\s*\{[\s\S]*?\n\s*\})\);/
    );
    expect(closeHandlerMatch).not.toBeNull();

    let preventDefaultCalls = 0;
    let hideCalls = 0;
    let shutdownCalls = 0;
    const closeHandler = runInNewContext(`(${closeHandlerMatch[1]})`, {
      isQuitting: false,
      mainWindow: {
        hide() {
          hideCalls += 1;
        }
      },
      process: { platform: 'win32' },
      shutdownTelegram() {
        shutdownCalls += 1;
      },
      tray: {}
    });

    closeHandler({
      preventDefault() {
        preventDefaultCalls += 1;
      }
    });

    expect(preventDefaultCalls).toBe(1);
    expect(hideCalls).toBe(1);
    expect(shutdownCalls).toBe(0);
  });

  it('routes the real exit through one guarded shutdown path', () => {
    expect(mainSource).toContain('function requestQuit()');
    expect(mainSource).toContain('isQuitting = true;');
    expect(mainSource).toContain('shutdownTelegram()');
    expect(mainSource).toContain('app.quit();');
    expect(mainSource).toContain("app.on('will-quit'");
  });

  it('does not shut down Telegram when the window is only closed to tray', () => {
    expect(mainSource).toContain('if (isQuitting) return;');
    expect(mainSource).toContain("mainWindow.on('close'");
  });

  it('guards tray creation and second-instance reuse', () => {
    expect(mainSource).toContain('if (tray) return;');
    expect(mainSource).toContain("app.on('second-instance'");
    expect(mainSource).toContain('showMainWindow();');
  });

  it('focuses the existing window for a second instance', () => {
    expect(mainSource).toContain("app.on('second-instance'");
    expect(mainSource).toContain('showMainWindow();');
  });
});