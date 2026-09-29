import sys
import asyncio
import edge_tts


async def generate_speech(text, voice, output_file):
    communicate = edge_tts.Communicate(
        text,
        voice
    )

    await communicate.save(output_file)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 tts.py <text> <voice> <output_file>")
        sys.exit(1)

    text = sys.argv[1]
    voice = sys.argv[2]
    output_file = sys.argv[3]

    try:
        asyncio.run(
            generate_speech(
                text,
                voice,
                output_file
            )
        )

        print("TTS_SUCCESS")

    except Exception as error:
        print("TTS_ERROR:", str(error))
        sys.exit(1)