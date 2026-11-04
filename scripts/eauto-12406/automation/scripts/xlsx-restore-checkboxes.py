# Put Excel in-cell checkboxes (Insert > Checkbox, Excel 2024/365) back on a
# column after openpyxl has saved the workbook. openpyxl keeps the TRUE/FALSE
# values but drops the checkbox feature (featurePropertyBag + the xfComplement
# on the cell style), so the tickboxes turn into plain TRUE / FALSE text.
#
#   python automation/scripts/xlsx-restore-checkboxes.py <file.xlsx> [column=M | columns=J,L,M]
#
# Every boolean cell in that column (or those columns, comma-separated, when the
# sheets put Review in different places) becomes a checkbox again; ticked stays ticked.
import re, shutil, sys, tempfile, zipfile

path = sys.argv[1]
cols = [c.strip().upper() for c in (sys.argv[2] if len(sys.argv) > 2 else "M").split(",") if c.strip()]
col = "|".join(cols)

NS = 'xmlns:xfpb="http://schemas.microsoft.com/office/spreadsheetml/2022/featurepropertybag"'
EXT = f'<extLst><ext uri="{{C7286773-470A-42A8-94C5-96B5CB345126}}" {NS}><xfpb:xfComplement i="0"/></ext></extLst>'
BAG = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<FeaturePropertyBags xmlns="http://schemas.microsoft.com/office/spreadsheetml/2022/featurepropertybag">'
       '<bag type="Checkbox"/><bag type="XFControls"><bagId k="CellControl">0</bagId></bag><bag type="XFComplement"><bagId k="XFControls">1</bagId></bag>'
       '<bag type="XFComplements" extRef="XFComplementsMapperExtRef"><a k="MappedFeaturePropertyBags"><bagId>2</bagId></a></bag></FeaturePropertyBags>')
BAG_PART = "xl/featurePropertyBag/featurePropertyBag.xml"

zin = zipfile.ZipFile(path)
files = {n: zin.read(n) for n in zin.namelist()}
zin.close()

styles = files["xl/styles.xml"].decode("utf-8")
m = re.search(r"<cellXfs count=\"(\d+)\">(.*?)</cellXfs>", styles, re.S)
xfs = re.findall(r"<xf\b[^>]*/>|<xf\b[^>]*>.*?</xf>", m.group(2), re.S)

def with_ext(xf: str) -> str:
    if "xfComplement" in xf:
        return xf
    if xf.endswith("/>"):
        return xf[:-2] + ">" + EXT + "</xf>"
    return xf[:-5] + EXT + "</xf>"

sheet_names = [n for n in files if re.match(r"xl/worksheets/sheet\d+\.xml$", n)]
mapping: dict[int, int] = {}
changed = 0
for sn in sheet_names:
    xml = files[sn].decode("utf-8")
    def fix(mo):
        global changed
        cell = mo.group(0)
        s = re.search(r'\bs="(\d+)"', cell)
        idx = int(s.group(1)) if s else 0
        if "xfComplement" in xfs[idx]:
            return cell
        if idx not in mapping:
            xfs.append(with_ext(xfs[idx]))
            mapping[idx] = len(xfs) - 1
        changed += 1
        return re.sub(r'\bs="\d+"', f's="{mapping[idx]}"', cell) if s else cell.replace("<c ", f'<c s="{mapping[idx]}" ', 1)
    xml = re.sub(rf'<c r="(?:{col})\d+"[^>]*t="b"[^>]*>', fix, xml)
    files[sn] = xml.encode("utf-8")

styles = styles[:m.start()] + f'<cellXfs count="{len(xfs)}">' + "".join(xfs) + "</cellXfs>" + styles[m.end():]
files["xl/styles.xml"] = styles.encode("utf-8")

files[BAG_PART] = BAG.encode("utf-8")
ct = files["[Content_Types].xml"].decode("utf-8")
if "featurePropertyBag" not in ct:
    ct = ct.replace("</Types>", '<Override PartName="/xl/featurePropertyBag/featurePropertyBag.xml" ContentType="application/vnd.ms-excel.featurepropertybag+xml"/></Types>')
files["[Content_Types].xml"] = ct.encode("utf-8")
rels = files["xl/_rels/workbook.xml.rels"].decode("utf-8")
if "FeaturePropertyBag" not in rels:
    ids = [int(x) for x in re.findall(r'Id="rId(\d+)"', rels)]
    rels = rels.replace("</Relationships>", f'<Relationship Id="rId{max(ids) + 1}" Type="http://schemas.microsoft.com/office/2022/11/relationships/FeaturePropertyBag" Target="featurePropertyBag/featurePropertyBag.xml"/></Relationships>')
files["xl/_rels/workbook.xml.rels"] = rels.encode("utf-8")

tmp = tempfile.mktemp(suffix=".xlsx")
with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
    order = ["[Content_Types].xml"] + [n for n in files if n != "[Content_Types].xml"]
    for n in order:
        z.writestr(n, files[n])
shutil.move(tmp, path)
print(f"{path}: {changed} cells in column {', '.join(cols)} are checkboxes again")
