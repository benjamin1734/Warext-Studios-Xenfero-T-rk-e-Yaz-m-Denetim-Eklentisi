import argparse
import json
import random
from pathlib import Path

GOOD = [
    ('Çocuk suyu içti.',0,1,0,0.72),('Çocuk kitabı okudu.',0,1,0,0.76),('Adam arabayı sürdü.',0,1,0,0.72),('Kullanıcı dosyayı indirdi.',0,1,0,0.68),('Yönetici sunucuyu yeniden başlattı.',0,1,0,0.7),('Ayşe kitabı aldı ve onu okudu.',0,1,0,0.65),('Bu işe göz attım.',0,1,1,0.61),('Telefonu şarja taktım.',0,1,0,0.63),('Sunucu kapalıydı ancak şimdi açık.',0,1,0,0.66),('Dosyayı açıp kodu düzenledim.',0,1,0,0.69)
]
BAD = [
    ('Masa koştu.',1,1,0,0.08),('Çocuk kitabı içti.',1,1,0,0.1),('Bilgisayar acıktı.',1,1,0,0.09),('Adam gömleği sürdü.',1,1,0,0.12),('Telefon kitabı yedi.',1,1,0,0.08),('Sunucu kapalı. Sunucu açık.',1,1,0,0.14),('Kesinlikle belki gelir.',1,1,0,0.12),('Herkes hiç kimse gelmedi.',1,1,0,0.1),('Dosya kahveyi içti.',1,1,0,0.07),('Araba kitabı okudu.',1,1,0,0.09)
]
NOUNS = ['çocuk','adam','kadın','kullanıcı','yönetici','öğrenci','mühendis','doktor','oyuncu']
READABLE = ['kitabı','makaleyi','raporu','mesajı','rehberi','kodu']
DRINKABLE = ['suyu','çayı','kahveyi','sütü','ayranı']
WRONG_OBJECTS = ['gömleği','duvarı','masayı','sandalyeyi','klavyeyi']

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--output',required=True); parser.add_argument('--samples',type=int,default=12000); args=parser.parse_args()
    rng=random.Random(20260820); rows=[]
    while len(rows)<args.samples:
        if rng.random()<0.5:
            if rng.random()<0.5:
                text=f"{rng.choice(NOUNS).capitalize()} {rng.choice(READABLE)} okudu."
            else:
                text=f"{rng.choice(NOUNS).capitalize()} {rng.choice(DRINKABLE)} içti."
            row={'text':text,'label':1,'semantic_conflicts':0,'dependency_complete':1,'idiom':0,'lm_score':round(rng.uniform(.45,.9),3)}
        else:
            if rng.random()<0.5:
                text=f"{rng.choice(NOUNS).capitalize()} {rng.choice(WRONG_OBJECTS)} içti."
            else:
                text=f"Masa {rng.choice(['koştu','acıktı','uyudu'])}."
            row={'text':text,'label':0,'semantic_conflicts':1,'dependency_complete':1,'idiom':0,'lm_score':round(rng.uniform(.02,.2),3)}
        rows.append(row)
    for text,conf,dep,idiom,lm in GOOD:
        rows.append({'text':text,'label':1,'semantic_conflicts':conf,'dependency_complete':dep,'idiom':idiom,'lm_score':lm})
    for text,conf,dep,idiom,lm in BAD:
        rows.append({'text':text,'label':0,'semantic_conflicts':conf,'dependency_complete':dep,'idiom':idiom,'lm_score':lm})
    Path(args.output).write_text('\n'.join(json.dumps(row,ensure_ascii=False,separators=(',',':')) for row in rows) + '\n',encoding='utf-8')
    print(json.dumps({'samples':len(rows)},separators=(',',':')))

if __name__=='__main__':
    main()
