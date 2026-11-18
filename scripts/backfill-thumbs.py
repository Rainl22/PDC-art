"""One-off: create a 600px `<name>-t.jpg` next to every photo in the public `submissions` bucket.
Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... python3 scripts/backfill-thumbs.py url1.jpg url2.jpg ...   (full public URLs)
Uses the public anon key (anon may insert into `submissions`). Skips thumbnails that already exist."""
import io, os, sys, urllib.request, urllib.error
from PIL import Image, ImageOps
base = os.environ['SUPABASE_URL'].rstrip('/'); key = os.environ['SUPABASE_ANON_KEY']
ok = skipped = failed = 0
for url in sys.argv[1:]:
    name = url.rsplit('/', 1)[1]
    thumb = name[:-4] + '-t.jpg'
    turl = url[:-len(name)] + thumb
    try:
        urllib.request.urlopen(urllib.request.Request(turl, method='HEAD')); skipped += 1; continue
    except urllib.error.HTTPError:
        pass
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(urllib.request.urlopen(url).read()))).convert('RGB')
        img.thumbnail((600, 600))
        buf = io.BytesIO(); img.save(buf, 'JPEG', quality=72, optimize=True, progressive=True)
        req = urllib.request.Request(f'{base}/storage/v1/object/submissions/{thumb}', data=buf.getvalue(), method='POST',
            headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'image/jpeg'})
        urllib.request.urlopen(req); ok += 1; print('uploaded', thumb, len(buf.getvalue()) // 1024, 'KB')
    except Exception as e:
        failed += 1; print('FAILED', name, e)
print(f'done: {ok} uploaded, {skipped} already there, {failed} failed')
