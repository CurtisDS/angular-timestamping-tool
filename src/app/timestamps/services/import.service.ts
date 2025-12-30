import { Injectable } from '@angular/core';
export enum CancelMode {
	Always,
	IfNeeded,
	Never,
}

@Injectable({
	providedIn: 'root',
})
export class ImportService {
	constructor() {}
	
	importChapters = "";
	importing = false;

	requireClockUpdate = false;

	get hasUnsavedChapters():boolean {
		return this.importChapters.trim() != "";
	}

	/**
	 * Cancels the current import.
	 *
	 * By default, a confirmation dialog is shown only if there are
	 * {@link hasUnsavedChapters unsaved chapters}.
	 *
	 * @param mode Controls confirmation behavior:
	 * - {@link CancelMode.Always} – always ask for confirmation
	 * - {@link CancelMode.IfNeeded} – ask only if there are unsaved chapters (default)
	 * - {@link CancelMode.Never} – cancel immediately without confirmation
	 *
	 * @returns {boolean} true if the import was cancelled
	 */
	cancelImport(mode: CancelMode = CancelMode.IfNeeded): boolean {
		const needsConfirmation =
			mode === CancelMode.Always ||
			(mode === CancelMode.IfNeeded && this.hasUnsavedChapters);

		if(needsConfirmation && !confirm("This will cancel the import. Are you sure?")) {
			return false;
		}

		this.importChapters = "";
		this.importing = false;
		return true;
	}

	/** initialize {@link importChapters imported chapters} string and turn on {@link importing importing mode} */
	startImport() {
		this.importChapters = "";
		this.importing = true;
	}
}