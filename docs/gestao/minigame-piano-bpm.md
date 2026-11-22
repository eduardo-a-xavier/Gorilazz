# Pesquisa de BPM, compasso e licença de áudio — Minigame rítmico de piano do 2-D

- **Projeto:** Gorilazz A3 (`E:\Gorilazz-Relatorio`)
- **Data da pesquisa / acesso às fontes:** 22/11/2026
- **Escopo:** Levantamento verificável de andamento (BPM), compasso e viabilidade jurídica de áudio para o minigame rítmico de piano no site. Sem uso exclusivo da Wikipédia; divergências entre fontes registradas explicitamente.

---

## 1. Tabela de faixas, BPM e compasso

| Faixa | Álbum | Ano | BPM | Compasso | Divergências / notas de andamento | Fontes (acesso em 22/11/2026) |
| --- | --- | --- | --- | --- | --- | --- |
| **Tomorrow Comes Today** | *Gorillaz* (EP nov/2000; álbum 2001) | 2000/2001 | **93 BPM** | **4/4** | Também indexada em *double-time* como **186 BPM** no SongBPM. Tonalidade de referência: F♯ maior / G♭ maior. | SongBPM (`songbpm.com`), Tunebat (`tunebat.com`) |
| **Clint Eastwood** | *Gorillaz* | 2001 | **84 BPM** | **4/4** | Divergência de contagem: **168 BPM** (*double-time* automático) no SongBPM e Tunebat; **83–85 BPM** (pulso padrão/*half-time*) no GetSongBPM. Para jogabilidade de piano, usar **84 BPM** (ou grade em colcheias a 168). | SongBPM (`songbpm.com`), Tunebat (`tunebat.com`), GetSongBPM (`getsongbpm.com`) |
| **On Melancholy Hill** | *Plastic Beach* | 2010 | **120 BPM** | **4/4** | Consistente em 120 BPM nas bases consultadas. Tonalidade de referência: D maior. | Tunebat (`tunebat.com`), SongBPM (`songbpm.com`) |
| **Feel Good Inc.** *(extra 1)* | *Demon Days* | 2005 | **138–139 BPM** (áudio) / **134 BPM** (partitura) | **4/4** | Divergência entre fontes: Musicnotes indica **~134 BPM** na transcrição em partitura; SongBPM e Tunebat indexam o áudio de streaming em **138–139 BPM**. Recomenda-se adotar **138 BPM** (ou permitir ajuste fino). | Musicnotes (`musicnotes.com`), SongBPM (`songbpm.com`), GetSongBPM (`getsongbpm.com`) |
| **Humility** *(extra 2)* | *The Now Now* | 2018 | **80 BPM** | **4/4** | Divergência de contagem: **80 BPM** (pulso padrão na partitura/Musicnotes e SongBPM) vs. **160 BPM** (*double-time*) no Tunebat. Tonalidade de referência: C maior. | Musicnotes (`musicnotes.com`), SongBPM (`songbpm.com`), Tunebat (`tunebat.com`) |

### O que não foi possível confirmar diretamente

- **Medição direta sobre os fonogramas originais:** não há arquivos de áudio oficiais de Gorillaz no repositório e não foi feita extração de áudio de plataformas de streaming.
- **Partituras impressas oficiais (Hal Leonard / EMI Music Publishing):** não foram consultadas em PDF/impresso; para *Tomorrow Comes Today* e *On Melancholy Hill*, os valores vêm das bases indexadas SongBPM e Tunebat (sem confirmação adicional via ficha de partitura da Musicnotes).
- **BPM dos instrumentais locais da Kong FM:** não foi medido/confirmado o BPM exato de `concreto.mp3` e `mare.mp3` (marcados como **não confirmado**).

---

## 2. Auditoria de áudio local e conclusão de licença

### O que existe hoje em `E:\Gorilazz-Relatorio`

1. **`assets/radio/concreto.mp3`** (78.109 bytes, SHA-256 `2717334056389e35f15897eaee71ee7553c08c633d47b5b5c9ffe8432115bd07`) — listado em `src/local-radio.js` e `README.md:180` como *"Concreto — Kong FM · instrumental original"*.
2. **`assets/radio/mare.mp3`** (75.399 bytes, SHA-256 `b56f93f31c3b304d72a244efa99a82ffd8887759c7e921bd0f425ebcfc4fb635`) — listado como *"Maré de plástico — Kong FM · instrumental original"*.
3. **Síntese de reserva em `src/local-radio.js` (`fallbackTone`):** gerador simples de notas via Web Audio API usado quando os arquivos da rádio falham.
4. **Carregamento local pelo usuário:** o rádio permite ao visitante selecionar arquivos de áudio do próprio dispositivo em memória (`URL.createObjectURL`), sem hospedagem ou redistribuição pelo site.

> **Observação de inventário:** os dois MP3s da Kong FM são declarados como instrumentais originais no código e no `README.md`, mas ainda não possuem arquivo de licença explícita nem entrada com autoria/SHA-256 em `REFERENCES.md`.

### Conclusão jurídica para o minigame

- **Não há nenhum trecho de áudio oficial de Gorillaz que possa ser hospedado ou embutido legalmente no site.** As gravações fonográficas (℗ Parlophone Records Limited / Gorillaz Partnership / Warner Music Group) e as composições têm direitos autorais fechados, sem licença aberta para redistribuição em aplicações web.
- **Solução recomendada (obrigatória):** o minigame deve usar **batida e timbres de piano/sintetizador gerados originalmente no navegador (Web Audio API)** no **BPM e compasso (4/4)** indicados na tabela acima, com padrões rítmicos originais inspirados no andamento de cada fase — **sem embutir samples, MP3s comerciais ou reprodução literal da melodia protegida**.

---

## 3. Textos curtos de crédito sugeridos para o minigame

- **Para o rodapé/cartão do minigame (completo, 118 caracteres):**
  > `Minigame rítmico autoral (áudio sintetizado via Web Audio). Andamentos (BPM) inspirados na discografia de Gorillaz · uso acadêmico.`
- **Para barra compacta / canvas (curto, 62 caracteres):**
  > `Áudio sintetizado próprio · BPMs de referência · uso acadêmico`

### Nota editorial

- Manter a distinção do projeto: **2-D** é o personagem virtual (vocalista na ficção; voz real principalmente de Damon Albarn), e o minigame de piano é uma atividade lúdica autoral do trabalho acadêmico, sem vínculo oficial ou áudio comercial da banda.
