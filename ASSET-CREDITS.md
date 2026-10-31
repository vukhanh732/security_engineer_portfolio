# Portfolio asset credits

The main retro desk uses Henry Heffernan's original MIT-licensed artwork, personalized for Vu with a slate/teal/copper palette, working drawer, custom books and object interactions. The source license and attribution are included with the self-hosted files. The HTML portfolio, desktop window manager, games, hobbies architecture/furniture and VL favicon are built for Vu Luu.

| Asset | Author / source | License | Use / modifications |
| --- | --- | --- | --- |
| Retro desk, computer and decor | [Henry Heffernan, portfolio-website](https://github.com/henryjeff/portfolio-website) | MIT, Copyright 2024 Henry Heffernan | Three original GLB files plus baked computer, environment and decor textures. Self-hosted source GLBs stay byte-for-byte intact; JPEG textures converted to WebP at original 4096×4096 dimensions. At runtime the top drawer front/handle and paper-tray geometry are removed and replaced with Vu's original drawer, tray, books and stationery. Materials are recolored, the plant gains a sway shader, and Vu's screen and details are added. Complete notice: [`assets/desk/LICENSE-Henry-Heffernan.txt`](assets/desk/LICENSE-Henry-Heffernan.txt). |
| Phosphor folder/document/game icons | [Phosphor Icons](https://github.com/phosphor-icons/core) | MIT | Self-hosted desktop icons, unchanged. License in `assets/icons/LICENSE`. |
| Boardgame Pack v2 | [Kenney](https://opengameart.org/content/boardgame-pack) | CC0 | Playing cards, green back and card placement/sliding audio. License in `assets/cards/LICENSE.txt`. |
| Interface Sounds | [Kenney](https://opengameart.org/content/interface-sounds) | CC0 | Original clicks renamed `click.ogg` and `close.ogg`. License in `assets/audio/kenney-interface-license.txt`. |
| Sunset Walk | [Kilua Boy](https://opengameart.org/content/sunset-walk-ambient-quiet-sweet-loop) | CC0 | Original quiet ambient OGG loop, renamed `sunset-walk.ogg`. |
| Three.js 0.186.1 | [Three.js contributors](https://github.com/mrdoob/three.js) | MIT | Pinned renderer, GLTFLoader, RoundedBoxGeometry and required utilities. License in `js/vendor/LICENSE`. |
| Space Grotesk / IBM Plex | Existing self-hosted portfolio fonts | SIL OFL | Original files and licenses in `fonts/`. |
| BrainTrain / Wazuh screenshots | Vu Luu | Existing project assets | Real project evidence. BrainTrain is labeled as the previously published version; its redesign is not published. |
| Legacy furniture pack | [Kenney](https://opengameart.org/content/furniture-kit) | CC0 | Historical OBJ/MTL files retained in `assets/models/`, not requested by the active site. |

The exact source commit, original download hashes, modifications, dimensions and output sizes are recorded in `assets/desk/provenance.json`. The six desk-artwork files total **1,361,990 bytes**. All production files are self-hosted; the site makes no third-party requests for its 3D scene.

The office restores the source Background mesh and its baked light/shadows; the added study shell, bookshelf and windows are removed. The freestanding Hobbies door, hobbies hall, gym equipment, court and card room are original geometry. The gym/court/card furniture remains in the separate hall and makes no additional artwork downloads.

The loading/sharing image, `images/office-door-20261031.webp`, is a sharp capture of the actual open office. The previous photogrammetry/HDR study and its artificial weather cycle have been removed from the active implementation. The desktop is an independent retro-inspired interface, with Vu's own content and existing form, games and audio behavior.

Typing samples (`typing-1.mp3` through `typing-3.mp3`) and the low-volume office ambience (`office.ogg`) are self-hosted from the same pinned MIT-licensed Henry Heffernan source repository, 326,800 bytes in total. Original source URLs, SHA-256 hashes and sizes are in `assets/audio/office-provenance.json`; the exact source notice is included at `assets/audio/LICENSE-Henry-Heffernan.txt`. These samples load only after explicit sound activation. The existing CC0 Sunset Walk music remains credited above.
