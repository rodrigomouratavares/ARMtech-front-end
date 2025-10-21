import { useEffect } from 'react';

interface UseKeyboardShortcutProps {
	key: string;
	ctrlKey?: boolean;
	metaKey?: boolean;
	callback: () => void;
	enabled?: boolean;
}

export const useKeyboardShortcut = ({
	key,
	ctrlKey = false,
	metaKey = false,
	callback,
	enabled = true,
}: UseKeyboardShortcutProps) => {
	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Verificação de segurança para event.key
			if (!event.key) return;

			const isCtrlPressed = ctrlKey ? event.ctrlKey : !event.ctrlKey;
			const isMetaPressed = metaKey ? event.metaKey : !event.metaKey;
			const isCorrectKey = event.key.toLowerCase() === key.toLowerCase();

			if (isCorrectKey && isCtrlPressed && isMetaPressed) {
				event.preventDefault();
				callback();
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [key, ctrlKey, metaKey, callback, enabled]);
};

// Hook específico para o atalho de pesquisa (Ctrl+K / Cmd+K)
export const useSearchShortcut = (callback: () => void, enabled = true) => {
	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Verificação de segurança para event.key
			if (!event.key) return;

			// Verifica se é Ctrl+K (Windows/Linux) ou Cmd+K (Mac)
			const isSearchShortcut =
				event.key.toLowerCase() === 'k' &&
				(event.ctrlKey || event.metaKey) &&
				!event.shiftKey &&
				!event.altKey;

			if (isSearchShortcut) {
				event.preventDefault();
				callback();
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [callback, enabled]);
};
