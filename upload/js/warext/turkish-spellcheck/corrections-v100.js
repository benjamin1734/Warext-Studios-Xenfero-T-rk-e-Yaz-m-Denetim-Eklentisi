(() => {
  'use strict';
  if (window.WarextCorrectionMapV100) return;
  const data = {
    'herkez':'herkes','yanlız':'yalnız','yalnış':'yanlış','malesef':'maalesef','orjinal':'orijinal','şarz':'şarj','klavuz':'kılavuz','traş':'tıraş',
    'şöför':'şoför','süpriz':'sürpriz','antreman':'antrenman','çünki':'çünkü','deyil':'değil','müsade':'müsaade','eşortman':'eşofman','labaratuvar':'laboratuvar',
    'döküman':'doküman','insiyatif':'inisiyatif','seyehat':'seyahat','poaça':'poğaça','zerafet':'zarafet','egsoz':'egzoz','asvalt':'asfalt'
  };
  window.WarextCorrectionMapV100 = new Map(Object.entries(data));
})();
