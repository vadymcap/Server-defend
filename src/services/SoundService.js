class SoundService {
    constructor() {
        this.ctx        = null;
        this.muted      = false;
        this.masterGain = null;

        // Per-category gain nodes — wired after AudioContext is running
        this.categoryGains = {};   // { gameplay, events }
        this._sfxCat       = null; // set by tag() wrappers to route playTone

        // BGM tracks
        this.gameBgm         = new Audio('assets/sounds/game-background.mp3');
        this.gameBgm.loop    = true;
        this.gameBgm.volume  = 0.14;   // will be overridden by category slider

        this.menuBgm         = new Audio('assets/sounds/menu.mp3');
        this.menuBgm.loop    = true;
        this.menuBgm.volume  = 0.20;

        this.currentBgm = null;

        // UI click / hover sounds
        this.sfxHover        = new Audio('assets/sounds/click-5.mp3');
        this.sfxClick        = new Audio('assets/sounds/click-9.mp3');
        this.sfxHover.volume = 0.18;
        this.sfxClick.volume = 0.25;

        // Per-category state mirrored here so SoundService can be queried
        // without knowing about the panel.  The panel overrides these via setters.
        this.volMaster   = 0.30;
        this.volBgm      = 0.20;
        this.volUi       = 0.45;
        this.volGameplay = 0.50;
        this.volEvents   = 0.60;

        this.muteMaster   = false;
        this.muteBgm      = false;
        this.muteUi       = false;
        this.muteGameplay = false;
        this.muteEvents   = false;
    }

    // ── AudioContext init ─────────────────────────────────────────────────────
    init() {
        if (this.ctx) return;
        const AudioCtx  = window.AudioContext || window.webkitAudioContext;
        this.ctx        = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muteMaster ? 0 : this.volMaster;
        this.masterGain.connect(this.ctx.destination);

        const tryResume = () => {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            if (this.ctx.state === 'running') {
                this._initCategoryGains();
                if (this.currentBgm && this.currentBgm.paused && !this.muted)
                    this.currentBgm.play().catch(() => {});
                window.removeEventListener('click',   tryResume);
                window.removeEventListener('keydown', tryResume);
            }
        };
        window.addEventListener('click',   tryResume);
        window.addEventListener('keydown', tryResume);
    }

    // ── Wire dedicated GainNodes for gameplay and events oscillator SFX ──────
    _initCategoryGains() {
        if (!this.ctx || this.ctx.state !== 'running') return;
        if (this.categoryGains.gameplay) return; // already done

        ['gameplay', 'events'].forEach(cat => {
            const g = this.ctx.createGain();
            const vol = cat === 'gameplay' ? this.volGameplay : this.volEvents;
            const muted = cat === 'gameplay' ? this.muteGameplay : this.muteEvents;
            g.gain.value = (muted || this.muteMaster) ? 0 : vol * this.volMaster;
            g.connect(this.masterGain);
            this.categoryGains[cat] = g;
        });
    }

    // ── BGM switching ─────────────────────────────────────────────────────────
    playMenuBGM() { this._switchBGM(this.menuBgm); }
    playGameBGM() { this._switchBGM(this.gameBgm); }

    _switchBGM(track) {
        if (this.currentBgm === track) {
            if (this.currentBgm.paused && !this.muted && this.ctx?.state === 'running')
                this.currentBgm.play().catch(() => {});
            return;
        }
        if (this.currentBgm) { this.currentBgm.pause(); this.currentBgm.currentTime = 0; }
        this.currentBgm = track;
        if (!this.muted && this.ctx?.state === 'running')
            this.currentBgm.play().catch(() => {});
    }

    // ── UI SFX (HTML <audio>) ─────────────────────────────────────────────────
    playMenuHover() {
        if (!this.muted && !this.muteUi) {
            this.sfxHover.currentTime = 0;
            this.sfxHover.play().catch(() => {});
        }
    }
    playMenuClick() {
        if (!this.muted && !this.muteUi) {
            this.sfxClick.currentTime = 0;
            this.sfxClick.play().catch(() => {});
        }
    }

    // ── Legacy toggleMute (still works; panel also calls this via window.toggleMute) ──
    toggleMute() {
        this.muted = !this.muted;
        this.muteMaster = this.muted;
        if (this.masterGain)
            this.masterGain.gain.value = this.muted ? 0 : this.volMaster;
        if (this.muted && this.currentBgm) {
            this.currentBgm.pause();
        } else if (!this.muted && this.currentBgm) {
            this.currentBgm.play().catch(() => {});
        }
        return this.muted;
    }

    // ── Core oscillator tone — routes through category gain if available ──────
    playTone(freq, type, duration, startTime = 0) {
        if (!this.ctx || this.muted || this.ctx.state !== 'running') return;

        const cat        = this._sfxCat || 'gameplay';
        const targetGain = this.categoryGains[cat] || this.masterGain;

        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        gain.gain.setValueAtTime(1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(targetGain);
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    // ── High-level SFX — each tagged with a category ─────────────────────────
    playPlace()        { this._tagged('gameplay', () => this.playTone(440, 'square',   0.1)); }
    playConnect()      { this._tagged('gameplay', () => this.playTone(880, 'sine',     0.1)); }
    playDelete()       { this._tagged('gameplay', () => { this.playTone(200, 'sawtooth', 0.2); this.playTone(150, 'sawtooth', 0.2, 0.1); }); }
    playSuccess()      { this._tagged('gameplay', () => { this.playTone(523.25, 'square', 0.1); this.playTone(659.25, 'square', 0.1, 0.1); }); }
    playFail()         { this._tagged('events',   () => this.playTone(150, 'sawtooth', 0.3)); }
    playFraudBlocked() { this._tagged('events',   () => { this.playTone(800, 'triangle', 0.05); this.playTone(1200, 'triangle', 0.1, 0.05); }); }

    playGameOver() {
        this._tagged('events', () => {
            if (!this.ctx || this.muted) return;
            [440, 415, 392, 370].forEach((f, i) => this.playTone(f, 'triangle', 0.4, i * 0.4));
        });
    }

    _tagged(cat, fn) {
        this._sfxCat = cat;
        fn();
        this._sfxCat = null;
    }

    // ── Volume setters called by the sound panel ──────────────────────────────

    setMasterVolume(vol, muted) {
        this.volMaster  = vol;
        this.muteMaster = muted;
        this.muted      = muted;
        if (this.masterGain)
            this.masterGain.gain.value = muted ? 0 : vol;
        // Cascade to sub-categories
        this._refreshBgmVolume();
        this._refreshUiVolume();
        this._refreshOscGain('gameplay');
        this._refreshOscGain('events');
    }

    setBgmVolume(vol, muted) {
        this.volBgm  = vol;
        this.muteBgm = muted;
        this._refreshBgmVolume();
    }

    setUiVolume(vol, muted) {
        this.volUi  = vol;
        this.muteUi = muted;
        this._refreshUiVolume();
    }

    setGameplayVolume(vol, muted) {
        this.volGameplay  = vol;
        this.muteGameplay = muted;
        this._refreshOscGain('gameplay');
    }

    setEventsVolume(vol, muted) {
        this.volEvents  = vol;
        this.muteEvents = muted;
        this._refreshOscGain('events');
    }

    _refreshBgmVolume() {
        const eff     = (this.muteMaster || this.muteBgm) ? 0 : this.volBgm * this.volMaster;
        const bgmOn   = !this.muteMaster && !this.muteBgm;
        if (this.gameBgm) this.gameBgm.volume = Math.min(1, eff * 0.7);
        if (this.menuBgm) this.menuBgm.volume = Math.min(1, eff);
        if (!bgmOn && this.currentBgm) {
            this.currentBgm.pause();
        } else if (bgmOn && this.currentBgm?.paused && this.ctx?.state === 'running') {
            this.currentBgm.play().catch(() => {});
        }
    }

    _refreshUiVolume() {
        const eff = (this.muteMaster || this.muteUi) ? 0 : this.volUi * this.volMaster;
        if (this.sfxHover) this.sfxHover.volume = Math.min(1, eff * 0.4);
        if (this.sfxClick) this.sfxClick.volume = Math.min(1, eff * 0.5);
    }

    _refreshOscGain(cat) {
        const g = this.categoryGains[cat];
        if (!g) return;
        const vol   = cat === 'gameplay' ? this.volGameplay   : this.volEvents;
        const muted = cat === 'gameplay' ? this.muteGameplay  : this.muteEvents;
        g.gain.value = (muted || this.muteMaster) ? 0 : vol * this.volMaster;
    }
}