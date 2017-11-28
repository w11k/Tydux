

# problem

konkurrenz zwischen store und mutators: 
- soll eine methode in den S oder in die MC. 
- als aufrufer ist man dadurch gezwungen, immer zu prüfen oder zu wissen, ob die interessante methode im S oder in der MC ist.
- als implementierer muss ich mich jedesmal überlegen ob in S oder MC.
- was, wenn logic zuerst in MC, aber dann aufrund steigender komplexität doch eine wrapper-ergänzung im S nötig wird? aufrufer müssen angepasst werden.


# definition

## mutators

- atomare, wiederverwendbare operationen direkt auf dem datenmodell
- use case neutral
- async ops. etc. wären sehr bad practice. am besten verhindern durch impl (um eine implementierung im store zu erwzingen)


## store

- orchestrierung der mutator methoden, besonders im async fall
- in simplen fällen können "delegates" hinzugefügt werden
- methoden für komplexere selects bzw gängige "select use cases" einen namen geben
- klassisches fassaden muster ? 


