"""
Narração provisória com a voz neural da Microsoft (pacote edge-tts), enquanto a chave
da ElevenLabs não chega. Grava public/voz/<cena>.mp3 e src/voz.json (duração e tempo de
cada palavra), no mesmo formato que generate-voiceover.ts usa.

Uso:  python gerar-voz-edge.py            (voz Francisca)
      python gerar-voz-edge.py antonio    (voz Antônio)
"""
import asyncio, json, os, re, sys
import edge_tts

VOZES = {"francisca": "pt-BR-FranciscaNeural", "antonio": "pt-BR-AntonioNeural", "thalita": "pt-BR-ThalitaMultilingualNeural"}
VOZ = VOZES.get(sys.argv[1] if len(sys.argv) > 1 else "francisca", "pt-BR-FranciscaNeural")

# lê as falas direto do roteiro (src/roteiro.ts)
roteiro = open("src/roteiro.ts", encoding="utf-8").read()
CENAS = re.findall(r"id: '(\w+)'.*?fala: '([^']+)'", roteiro)


async def gera(cid: str, fala: str):
    com = edge_tts.Communicate(fala, VOZ, rate="+6%", pitch="+0Hz", boundary="WordBoundary")
    audio = bytearray()
    palavras = []
    async for parte in com.stream():
        if parte["type"] == "audio":
            audio.extend(parte["data"])
        elif parte["type"] == "WordBoundary":
            ini = parte["offset"] / 1e7
            fim = (parte["offset"] + parte["duration"]) / 1e7
            palavras.append({"p": parte["text"], "ini": round(ini, 3), "fim": round(fim, 3)})
    with open(f"public/voz/{cid}.mp3", "wb") as f:
        f.write(audio)
    # cola a pontuação de volta nas palavras (a legenda mostra o texto como no roteiro)
    tokens = fala.split()
    if len(tokens) == len(palavras):
        for w, t in zip(palavras, tokens):
            w["p"] = t
    duracao = palavras[-1]["fim"] if palavras else 3
    return cid, {"duracao": duracao, "palavras": palavras}


async def main():
    os.makedirs("public/voz", exist_ok=True)
    saida = {}
    for cid, fala in CENAS:
        cid, dado = await gera(cid, fala)
        saida[cid] = dado
        print(f"ok {cid}  {dado['duracao']:.2f} s  ({len(dado['palavras'])} palavras)")
    with open("src/voz.json", "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)
    print("Pronto:", VOZ)

asyncio.run(main())
