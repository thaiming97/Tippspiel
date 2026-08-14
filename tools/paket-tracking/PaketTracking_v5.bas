Attribute VB_Name = "PaketTracking"
Option Explicit

'==========================================================================
'  Paket-Tracking fuer Excel (VBA) - 17TRACK   |   Version 5
'
'  Import: Alt+F11 -> altes Modul "PaketTracking" rechtsklicken -> entfernen
'          (Frage "exportieren?" mit Nein beantworten)
'          dann Datei -> Datei importieren -> diese .bas
'          Danach unten den 17TRACK Access Key eintragen.
'          Anschliessend einmal BlattVorbereiten laufen lassen.
'
'  Aenderungen gegenueber Version 4 - die Ampel bedeutet etwas anderes:
'   * Die Farbe haengt jetzt zuerst am STATUS, nicht am Wunschtermin.
'     Vorher blieb eine Zeile ohne Wunschtermin immer grau, egal was das
'     Paket gerade machte. Jetzt faerbt sich jede Zeile mit Sendungsnummer,
'     sobald ein Status da ist - ein Wunschtermin ist dafuer nicht noetig.
'   * Gruen heisst nur noch: angekommen. Ein eingehaltener Wunschtermin
'     macht nichts mehr gruen, solange das Paket noch unterwegs ist.
'   * Orange heisst jetzt: unterwegs (vorher: Prognose reisst den Termin).
'   * Gelb heisst jetzt: unterwegs und kommt laut Prognose rechtzeitig
'     (vorher: keine Prognose und Termin rueckt naeher).
'   * Rot ist dazugekommen fuer "zu langsam": Prognose liegt nach dem
'     Wunschtermin. Vorher war das orange.
'
'  AMPEL-LOGIK - was macht das Paket gerade?
'    Gruen   angekommen. Status "Zugestellt" - sonst nichts.
'    Rot     zu langsam oder Problem: Prognose liegt nach dem Wunschtermin,
'            Wunschtermin ist durch und nichts da, Problem beim
'            Dienstleister, oder Nummer unbrauchbar.   -> jetzt anrufen
'    Gelb    unterwegs und laut Prognose rechtzeitig da.  -> passt
'    Orange  unterwegs, aber ohne Zeitaussage: kein Wunschtermin
'            hinterlegt oder keine Prognose vom Dienstleister.
'    Grau    noch kein Status bekannt (nie aktualisiert, "Wird abgerufen")
'            oder keine Sendungsnummer.
'
'  Kurz: Gelb und Orange sind beide "unterwegs". Gelb ist unterwegs MIT
'  Rueckendeckung durch eine Prognose, Orange ist unterwegs ins Blaue.
'
'  Makros (Alt+F8):
'    BlattVorbereiten      1x: Format, Dropdown, Buttons, Spalten, Farben
'    PaketeAktualisieren   Status bei 17TRACK holen (Button 1)
'    AmpelNeuRechnen       nur Farben/Puffer neu, offline (Button 2)
'    Diagnose              prueft Key + zeigt die Rohantwort einer Nummer
'==========================================================================

Private Const TOKEN As String = "HIER_NEUEN_17TRACK_KEY_EINTRAGEN"
Private Const SHEETNAME As String = "Paket-Liste"
Private Const APIBASE As String = "https://api.17track.net/track/v2.4/"
Private Const MAXROWS As Long = 500

' Zugestellte Sendungen sind gruen - auch wenn sie zu spaet kamen.
' Auf True stellen, wenn eine zu spaet zugestellte Sendung rot bleiben soll.
Private Const ZU_SPAET_BLEIBT_ROT As Boolean = False

' Zugestellte Sendungen beim Abrufen ueberspringen (spart Guthaben).
' Ampel und Puffer werden fuer sie trotzdem neu gerechnet.
Private Const SKIP_ZUGESTELLT As Boolean = True

' Spaltenindizes, werden zur Laufzeit gefuellt
Private cNum As Long, cDL As Long, cPlan As Long, cEta As Long
Private cStat As Long, cAmp As Long, cUpd As Long, cLink As Long, cPuf As Long

'==========================================================================
'  1) Blatt vorbereiten - einmal ausfuehren
'==========================================================================
Public Sub BlattVorbereiten()
    Dim ws As Worksheet
    Set ws = HoleBlatt()
    If ws Is Nothing Then Exit Sub
    If Not SpaltenSuchen(ws) Then Exit Sub

    Application.ScreenUpdating = False

    ' --- fehlende Spalten hinten anhaengen ---
    If cPuf = 0 Then
        cPuf = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column + 1
        ws.Cells(1, cPuf).Value = "Puffer (Tage)"
        ws.Cells(1, cPuf).Font.Bold = True
        ws.Columns(cPuf).ColumnWidth = 12
    End If
    If cLink = 0 Then
        cLink = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column + 1
        ws.Cells(1, cLink).Value = "17TRACK-Link"
        ws.Cells(1, cLink).Font.Bold = True
        ws.Columns(cLink).ColumnWidth = 16
    End If

    ' --- Dienstleister-Liste ins Blatt "Listen" ---
    Dim wl As Worksheet, dl As Variant, i As Long, anz As Long
    dl = DienstleisterListe()
    anz = UBound(dl) - LBound(dl) + 1
    On Error Resume Next
    Set wl = ThisWorkbook.Sheets("Listen")
    On Error GoTo 0
    If wl Is Nothing Then
        Set wl = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        wl.Name = "Listen"
        wl.Visible = xlSheetHidden
    End If
    wl.Range("A1").Value = "Dienstleister"
    wl.Range("A2:A100").ClearContents
    For i = LBound(dl) To UBound(dl)
        wl.Cells(2 + i - LBound(dl), 1).Value = dl(i)
    Next i

    ' --- Dropdown Dienstleister (Eintrag bleibt freiwillig) ---
    If cDL > 0 Then
        With ws.Range(ws.Cells(2, cDL), ws.Cells(MAXROWS, cDL)).Validation
            .Delete
            .Add Type:=xlValidateList, AlertStyle:=xlValidAlertInformation, _
                 Formula1:="=Listen!$A$2:$A$" & (anz + 1)
            .IgnoreBlank = True
            .InCellDropdown = True
            .ShowError = False
        End With
    End If

    ' --- Ampel-Spalte: kein Dropdown, keine Handfarben (macht jetzt die
    '     bedingte Formatierung) ---
    If cAmp > 0 Then
        With ws.Range(ws.Cells(2, cAmp), ws.Cells(MAXROWS, cAmp))
            .Validation.Delete
            .Interior.ColorIndex = xlNone
            .Font.ColorIndex = xlAutomatic
        End With
    End If

    ' --- Datumsspalten sauber formatieren ---
    If cPlan > 0 Then ws.Range(ws.Cells(2, cPlan), ws.Cells(MAXROWS, cPlan)).NumberFormat = "dd.mm.yyyy"
    If cEta > 0 Then ws.Range(ws.Cells(2, cEta), ws.Cells(MAXROWS, cEta)).NumberFormat = "dd.mm.yyyy"
    ws.Range(ws.Cells(2, cPuf), ws.Cells(MAXROWS, cPuf)).NumberFormat = "0"
    ws.Range(ws.Cells(2, cPuf), ws.Cells(MAXROWS, cPuf)).HorizontalAlignment = xlCenter

    ' --- Sendungsnummern reparieren + Spalte auf Text ---
    Dim n As Long, warnRows As String, warn As String, s As String
    For i = 2 To MAXROWS
        s = NummerLesen(ws.Cells(i, cNum), warn)
        If s <> "" Then
            n = n + 1
            If warn <> "" Then
                warnRows = warnRows & vbLf & "  Zeile " & i & ": " & s & "  (" & warn & ")"
            End If
        End If
    Next i
    With ws.Range(ws.Cells(2, cNum), ws.Cells(MAXROWS, cNum))
        .NumberFormat = "@"
        .HorizontalAlignment = xlLeft
    End With

    AmpelFormatierung ws
    ButtonsAnlegen ws
    BewerteAlleZeilen ws

    Application.ScreenUpdating = True

    Dim msg As String
    msg = "Blatt vorbereitet." & vbLf & vbLf & _
          "Sendungsnummern gefunden: " & n & vbLf & _
          "Neue Spalten: 'Puffer (Tage)' und '17TRACK-Link'" & vbLf & _
          "Zeilenfarbe laeuft jetzt ueber bedingte Formatierung." & vbLf & _
          "Zwei Buttons liegen oben rechts neben der Tabelle."
    If warnRows <> "" Then
        msg = msg & vbLf & vbLf & _
              "ACHTUNG - diese Nummern waren als ZAHL gespeichert. Excel rechnet" & vbLf & _
              "intern nur mit 15 Stellen; laengere Nummern und fuehrende Nullen" & vbLf & _
              "gehen dabei verloren. Bitte neu eintragen:" & warnRows
    End If
    MsgBox msg, vbInformation, "Paket-Tracking"
End Sub

'==========================================================================
'  2) Status bei 17TRACK holen - laeuft NUR auf Knopfdruck
'==========================================================================
Public Sub PaketeAktualisieren()
    Dim ws As Worksheet
    Set ws = HoleBlatt()
    If ws Is Nothing Then Exit Sub
    If Not SpaltenSuchen(ws) Then Exit Sub

    If TOKEN = "HIER_NEUEN_17TRACK_KEY_EINTRAGEN" Then
        MsgBox "Bitte oben im Modul den 17TRACK Access Key eintragen.", vbExclamation
        Exit Sub
    End If

    Dim lastRow As Long, ueberMax As Boolean
    lastRow = ws.Cells(ws.Rows.Count, cNum).End(xlUp).Row
    If lastRow < 2 Then
        MsgBox "Keine Sendungsnummern gefunden.", vbInformation
        Exit Sub
    End If
    If lastRow > MAXROWS Then
        lastRow = MAXROWS
        ueberMax = True
    End If

    Dim i As Long, cc As Long, resp As String, fehler As String
    Dim body As String, cnt As Long
    Dim nums() As String, aktiv() As Boolean, warn As String
    ReDim nums(2 To lastRow)
    ReDim aktiv(2 To lastRow)

    Application.ScreenUpdating = False

    ' ---- Schritt 1: Nummern lesen und Zeilen auswaehlen ------------------
    Dim kaputt As Long, uebersprungen As Long
    For i = 2 To lastRow
        nums(i) = NummerLesen(ws.Cells(i, cNum), warn)
        aktiv(i) = False

        If nums(i) = "" Then
            SchreibZelle ws, i, cStat, "-"
            SchreibZelle ws, i, cEta, ""
        ElseIf warn <> "" Then
            ' unbrauchbare Nummer gar nicht erst abfragen
            SchreibZelle ws, i, cStat, "Nummer pruefen: " & warn
            kaputt = kaputt + 1
        Else
            ' Achtung: VBA wertet bei And IMMER beide Seiten aus ->
            ' Zellzugriff niemals in dieselbe Bedingung wie die Spaltenpruefung
            aktiv(i) = True
            If SKIP_ZUGESTELLT And cStat > 0 Then
                If InStr(1, CStr(ws.Cells(i, cStat).Value), "Zugestellt") > 0 Then
                    aktiv(i) = False
                    uebersprungen = uebersprungen + 1
                End If
            End If
        End If
    Next i

    ' ---- Schritt 2: registrieren (40er-Bloecke) --------------------------
    ' Ohne Eintrag in "Dienstleister" -> auto_detection, 17TRACK sucht den
    ' Carrier selbst. Mit Eintrag -> dieser Carrier hat Vorrang.
    body = "": cnt = 0
    For i = 2 To lastRow
        If aktiv(i) Then
            cc = 0
            If cDL > 0 Then cc = CarrierCode(CStr(ws.Cells(i, cDL).Value))
            If cnt > 0 Then body = body & ","
            If cc > 0 Then
                body = body & "{""number"":""" & nums(i) & """,""carrier"":" & cc & "}"
            Else
                body = body & "{""number"":""" & nums(i) & """,""auto_detection"":true}"
            End If
            cnt = cnt + 1
            If cnt = 40 Then
                resp = HttpPost("register", "[" & body & "]", fehler)
                If fehler <> "" Then GoTo ApiFehler
                body = "": cnt = 0
                Pause 0.4
            End If
        End If
    Next i
    If cnt > 0 Then
        resp = HttpPost("register", "[" & body & "]", fehler)
        If fehler <> "" Then GoTo ApiFehler
    End If

    ' ---- Schritt 3: Status je Zeile abholen ------------------------------
    Dim st As String, eta As String, deliv As String
    Dim pStat As Long, pEta As Long, pDel As Long, pEv As Long, pRej As Long
    Dim provider As Long, offen As Long, unklar As Long, ohneDL As Boolean
    Dim datum As Date

    For i = 2 To lastRow
        If Not aktiv(i) Then GoTo WeiterZeile
        Application.StatusBar = "Paket-Tracking: Zeile " & i & " von " & lastRow & " ..."

        resp = HttpPost("gettrackinfo", "[{""number"":""" & nums(i) & """}]", fehler)
        If fehler <> "" Then GoTo ApiFehler
        Pause 0.35

        st = "": eta = "": deliv = "": provider = 0

        ' von 17TRACK abgelehnt (Nummer unbekannt, Carrier nicht erkennbar)
        pRej = InStr(1, resp, """rejected"":[{")
        If pRej > 0 Then
            ohneDL = False
            If cDL > 0 Then ohneDL = (Trim$(CStr(ws.Cells(i, cDL).Value)) = "")
            If ohneDL Then
                SchreibZelle ws, i, cStat, "Carrier unklar - Dienstleister eintragen"
                unklar = unklar + 1
            Else
                SchreibZelle ws, i, cStat, "Nicht erkannt: " & JsonStr(resp, "message", pRej)
            End If
            SchreibZelle ws, i, cEta, ""
            SchreibZelle ws, i, cUpd, Format$(Now, "dd.mm.yyyy hh:mm")
            SetzeLink ws, i, nums(i)
            GoTo WeiterZeile
        End If

        pStat = InStr(1, resp, """latest_status""")
        If pStat > 0 Then st = JsonStr(resp, "status", pStat)

        ' von 17TRACK erkannter Carrier
        provider = JsonNum(resp, "key", InStr(1, resp, """provider"":{"))

        If st = "Delivered" Then
            pDel = InStr(1, resp, """key_stage"":""Delivered""")
            If pDel > 0 Then deliv = JsonStr(resp, "time_iso", pDel)
            If deliv = "" Then
                pEv = InStr(1, resp, """latest_event""")
                If pEv > 0 Then deliv = JsonStr(resp, "time_iso", pEv)
            End If
        Else
            pEta = InStr(1, resp, """estimated_delivery_date""")
            If pEta > 0 Then eta = JsonStr(resp, "to", pEta)
        End If

        ' echtes Datum in die Spalte, damit man damit rechnen kann
        If deliv <> "" Then
            datum = IsoToDate(deliv)
        ElseIf eta <> "" Then
            datum = IsoToDate(eta)
        Else
            datum = 0
        End If
        If cEta > 0 Then
            If datum > 0 Then
                ws.Cells(i, cEta).Value = datum
                ws.Cells(i, cEta).NumberFormat = "dd.mm.yyyy"
            Else
                ws.Cells(i, cEta).ClearContents
            End If
        End If

        Select Case st
            Case "Delivered":          st = "Zugestellt"
            Case "OutForDelivery":     st = "In Zustellung"
            Case "AvailableForPickup": st = "Abholbereit"
            Case "InTransit":          st = "Unterwegs"
            Case "InfoReceived":       st = "Avisiert"
            Case "Exception", "DeliveryFailure", "Expired", "Undelivered"
                st = "Problem"
            Case "NotFound", ""
                ' frisch registriert -> 17TRACK crawlt noch beim Dienstleister
                st = "Wird abgerufen"
                offen = offen + 1
        End Select

        ' Verspaetung direkt im Klartext vermerken
        If st = "Zugestellt" And cPlan > 0 And datum > 0 Then
            If IsDate(ws.Cells(i, cPlan).Value) Then
                If datum > CDate(ws.Cells(i, cPlan).Value) Then
                    st = st & " (" & CLng(datum - CDate(ws.Cells(i, cPlan).Value)) & " Tage zu spaet)"
                End If
            End If
        End If

        SchreibZelle ws, i, cStat, st
        SchreibZelle ws, i, cUpd, Format$(Now, "dd.mm.yyyy hh:mm")

        ' erkannten Carrier eintragen, aber nie eine manuelle Angabe ueberschreiben
        If cDL > 0 And provider > 0 Then
            If Trim$(CStr(ws.Cells(i, cDL).Value)) = "" Then
                ws.Cells(i, cDL).Value = CarrierName(provider)
            End If
        End If

        SetzeLink ws, i, nums(i)
WeiterZeile:
    Next i

    ' ---- Schritt 4: Ampel + Puffer fuer ALLE Zeilen -----------------------
    BewerteAlleZeilen ws
    Aufraeumen

    Dim m As String
    m = "Fertig."
    If uebersprungen > 0 Then _
        m = m & vbLf & vbLf & uebersprungen & " zugestellte Sendung(en) nicht erneut abgefragt."
    If offen > 0 Then
        m = m & vbLf & vbLf & offen & " Sendung(en) stehen auf 'Wird abgerufen'." & vbLf & _
            "17TRACK holt neu registrierte Nummern erst nach ein paar Minuten" & vbLf & _
            "beim Dienstleister ab. Einfach spaeter nochmal auf den Button."
    End If
    If unklar > 0 Then
        m = m & vbLf & vbLf & unklar & " Sendung(en): 17TRACK konnte den Carrier nicht" & vbLf & _
            "selbst erkennen. Dort bitte den Dienstleister eintragen und nochmal" & vbLf & _
            "aktualisieren."
    End If
    If kaputt > 0 Then
        m = m & vbLf & vbLf & kaputt & " Sendungsnummer(n) sind unbrauchbar (siehe Status)" & vbLf & _
            "und wurden nicht abgefragt."
    End If
    If ueberMax Then
        m = m & vbLf & vbLf & "Hinweis: es wurden nur die Zeilen 2 bis " & MAXROWS & _
            " verarbeitet." & vbLf & "Mehr Zeilen? Oben im Modul MAXROWS erhoehen."
    End If
    MsgBox m, vbInformation, "Paket-Tracking"
    Exit Sub

ApiFehler:
    Aufraeumen
    MsgBox "17TRACK meldet einen Fehler - deshalb kommen keine Daten:" & vbLf & vbLf & _
           fehler & vbLf & vbLf & _
           "Typische Ursachen:" & vbLf & _
           "  HTTP 401 / 403   Access Key falsch oder abgelaufen" & vbLf & _
           "  HTTP 429         zu viele Anfragen pro Sekunde" & vbLf & _
           "  code -18010013   Guthaben / Quota aufgebraucht" & vbLf & _
           "  Verbindung       Firmen-Proxy blockt api.17track.net", _
           vbExclamation, "Paket-Tracking"
End Sub

'==========================================================================
'  3) Nur Ampel + Puffer neu rechnen - ohne Internet, ohne Guthaben
'==========================================================================
Public Sub AmpelNeuRechnen()
    Dim ws As Worksheet
    Set ws = HoleBlatt()
    If ws Is Nothing Then Exit Sub
    If Not SpaltenSuchen(ws) Then Exit Sub

    Application.ScreenUpdating = False
    BewerteAlleZeilen ws
    Aufraeumen
    MsgBox "Ampel und Puffer neu berechnet." & vbLf & _
           "(keine Abfrage bei 17TRACK, nur mit den Daten aus der Tabelle)", _
           vbInformation, "Paket-Tracking"
End Sub

'==========================================================================
'  Bewertung: Ampel + Puffer aus Wunschtermin / Prognose / Status
'==========================================================================
Private Sub BewerteAlleZeilen(ws As Worksheet)
    Dim lastRow As Long, i As Long
    lastRow = ws.Cells(ws.Rows.Count, cNum).End(xlUp).Row
    If lastRow < 2 Then Exit Sub
    If lastRow > MAXROWS Then lastRow = MAXROWS

    Dim nummer As String, status As String
    Dim hatPlan As Boolean, hatProg As Boolean
    Dim plan As Date, prog As Date
    Dim amp As String, puffer As Variant

    For i = 2 To lastRow
        nummer = Trim$(CStr(ws.Cells(i, cNum).Text))

        status = ""
        If cStat > 0 Then status = CStr(ws.Cells(i, cStat).Value)

        hatPlan = False
        If cPlan > 0 Then
            If IsDate(ws.Cells(i, cPlan).Value) Then
                hatPlan = True
                plan = CDate(ws.Cells(i, cPlan).Value)
            End If
        End If

        hatProg = False
        If cEta > 0 Then
            If IsDate(ws.Cells(i, cEta).Value) Then
                hatProg = True
                prog = CDate(ws.Cells(i, cEta).Value)
            End If
        End If

        amp = AmpelWert(nummer, status, hatPlan, plan, hatProg, prog)

        ' Puffer = Tage Luft bis zum Wunschtermin.
        ' Bezug ist das Zustell-/Prognosedatum, sonst heute.
        puffer = ""
        If hatPlan And nummer <> "" Then
            If hatProg Then
                puffer = CLng(plan - prog)
            ElseIf InStr(1, status, "Zugestellt") = 0 Then
                puffer = CLng(plan - Date)
            End If
        End If

        If cAmp > 0 Then ws.Cells(i, cAmp).Value = amp
        If cPuf > 0 Then
            If puffer = "" Then
                ws.Cells(i, cPuf).ClearContents
            Else
                ws.Cells(i, cPuf).Value = puffer
            End If
        End If
    Next i
End Sub

' Die eigentliche Regel. Die Farbe haengt zuerst am STATUS, nicht am
' Wunschtermin - eine Zeile ohne Wunschtermin bekommt also trotzdem Farbe.
' Der Wunschtermin entscheidet nur noch zwischen Gelb und Rot.
Private Function AmpelWert(nummer As String, status As String, _
                           hatPlan As Boolean, plan As Date, _
                           hatProg As Boolean, prog As Date) As String
    ' 1) ohne Sendungsnummer gibt es nichts zu faerben
    If nummer = "" Then
        AmpelWert = "Grau"
        Exit Function
    End If

    ' 2) etwas ist kaputt oder haengt -> immer Handlungsbedarf
    If InStr(1, status, "Problem") > 0 _
       Or InStr(1, status, "Nicht erkannt") > 0 _
       Or InStr(1, status, "Nummer pruefen") > 0 _
       Or InStr(1, status, "Carrier unklar") > 0 Then
        AmpelWert = "Rot"
        Exit Function
    End If

    ' 3) angekommen -> Gruen. Das ist der EINZIGE Weg zu Gruen.
    '    Ob es zu spaet war, steht im Status und im Puffer.
    If InStr(1, status, "Zugestellt") > 0 Then
        If ZU_SPAET_BLEIBT_ROT And hatPlan And hatProg Then
            If prog > plan Then AmpelWert = "Rot" Else AmpelWert = "Gruen"
        Else
            AmpelWert = "Gruen"
        End If
        Exit Function
    End If

    ' 4) Wunschtermin ist durch und das Paket ist nicht da -> zu langsam
    If hatPlan Then
        If Date > plan Then
            AmpelWert = "Rot"
            Exit Function
        End If
    End If

    ' 5) unterwegs? Nur dann laesst sich ueberhaupt etwas sagen.
    '    "Wird abgerufen", "-" oder eine noch nie aktualisierte Zeile
    '    bleiben grau - da ist noch kein Status bekannt.
    If Not IstUnterwegs(status) Then
        AmpelWert = "Grau"
        Exit Function
    End If

    ' 6) unterwegs MIT Wunschtermin und Prognose -> haelt die Prognose?
    If hatPlan And hatProg Then
        If prog > plan Then AmpelWert = "Rot" Else AmpelWert = "Gelb"
        Exit Function
    End If

    ' 7) unterwegs, aber keine belastbare Aussage zur Zeit
    '    (kein Wunschtermin oder keine Prognose vom Dienstleister)
    AmpelWert = "Orange"
End Function

' Alles was das Paket bewegt, aber noch nicht beim Empfaenger ist.
' "Abholbereit" zaehlt bewusst dazu: liegt in der Filiale, nicht bei dir.
Private Function IstUnterwegs(status As String) As Boolean
    IstUnterwegs = (InStr(1, status, "Unterwegs") > 0 _
                Or InStr(1, status, "Zustellung") > 0 _
                Or InStr(1, status, "Abholbereit") > 0 _
                Or InStr(1, status, "Avisiert") > 0)
End Function

'==========================================================================
'  Bedingte Formatierung: Ampelzelle kraeftig, restliche Zeile hell
'==========================================================================
Private Sub AmpelFormatierung(ws As Worksheet)
    If cAmp = 0 Then Exit Sub

    Dim letzteSpalte As Long, sp As String
    Dim rngAmpel As Range, rngZeile As Range, links As Range, rechts As Range
    letzteSpalte = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    sp = SpalteBuchstabe(ws, cAmp)

    ' alte Regeln (auch die aus der Vorlage) weg
    ws.Range(ws.Cells(2, 1), ws.Cells(MAXROWS, letzteSpalte)).FormatConditions.Delete

    Set rngAmpel = ws.Range(ws.Cells(2, cAmp), ws.Cells(MAXROWS, cAmp))

    ' Zeilenbereich ohne die Ampelspalte, damit sich die Regeln nicht ueberlagern
    Set links = Nothing: Set rechts = Nothing
    If cAmp > 1 Then Set links = ws.Range(ws.Cells(2, 1), ws.Cells(MAXROWS, cAmp - 1))
    If cAmp < letzteSpalte Then Set rechts = ws.Range(ws.Cells(2, cAmp + 1), ws.Cells(MAXROWS, letzteSpalte))
    If links Is Nothing Then
        Set rngZeile = rechts
    ElseIf rechts Is Nothing Then
        Set rngZeile = links
    Else
        Set rngZeile = Union(links, rechts)
    End If

    ' kraeftig fuer die Ampelzelle selbst
    RegelAnlegen rngAmpel, sp, "Rot", RGB(220, 38, 38), vbWhite
    RegelAnlegen rngAmpel, sp, "Orange", RGB(234, 122, 12), vbWhite
    RegelAnlegen rngAmpel, sp, "Gelb", RGB(250, 204, 21), vbBlack
    RegelAnlegen rngAmpel, sp, "Gruen", RGB(22, 163, 74), vbWhite
    RegelAnlegen rngAmpel, sp, "Grau", RGB(150, 155, 160), vbWhite

    ' hell fuer die restliche Zeile - Text muss lesbar bleiben.
    ' Gelb und Orange bewusst weit auseinander: beide heissen "unterwegs",
    ' den Unterschied muss man im Augenwinkel trotzdem sehen.
    If Not rngZeile Is Nothing Then
        RegelAnlegen rngZeile, sp, "Rot", RGB(253, 226, 226), 0
        RegelAnlegen rngZeile, sp, "Orange", RGB(255, 224, 178), 0
        RegelAnlegen rngZeile, sp, "Gelb", RGB(255, 249, 196), 0
        RegelAnlegen rngZeile, sp, "Gruen", RGB(223, 246, 231), 0
        RegelAnlegen rngZeile, sp, "Grau", RGB(242, 243, 245), 0
    End If
End Sub

' schriftfarbe = 0 bedeutet: Schriftfarbe nicht anfassen
Private Sub RegelAnlegen(rng As Range, spalte As String, wert As String, _
                         fuellung As Long, schriftfarbe As Long)
    Dim fc As FormatCondition
    Set fc = rng.FormatConditions.Add(xlExpression, , _
             "=$" & spalte & "2=""" & wert & """")
    With fc
        .Interior.Color = fuellung
        If schriftfarbe <> 0 Then .Font.Color = schriftfarbe
        .StopIfTrue = True
    End With
End Sub

Private Function SpalteBuchstabe(ws As Worksheet, col As Long) As String
    SpalteBuchstabe = Split(ws.Cells(1, col).Address(True, True), "$")(1)
End Function

'==========================================================================
'  Buttons
'==========================================================================
Private Sub ButtonsAnlegen(ws As Worksheet)
    Dim links As Double, letzteSpalte As Long
    letzteSpalte = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    links = ws.Cells(1, letzteSpalte).Left + ws.Cells(1, letzteSpalte).Width + 15

    ButtonBauen ws, "btnPaketeAktualisieren", "Status aktualisieren", _
                "PaketeAktualisieren", links, 4, RGB(13, 110, 120)
    ButtonBauen ws, "btnAmpelNeuRechnen", "Ampel neu rechnen", _
                "AmpelNeuRechnen", links + 180, 4, RGB(90, 98, 108)
End Sub

' "name" ist in VBA ein Schluesselwort (Name x As y), deshalb shName
Private Sub ButtonBauen(ws As Worksheet, shName As String, beschriftung As String, _
                        makro As String, links As Double, oben As Double, farbe As Long)
    Dim sh As Shape
    On Error Resume Next
    ws.Shapes(shName).Delete
    On Error GoTo 0

    Set sh = ws.Shapes.AddShape(msoShapeRoundedRectangle, links, oben, 168, 30)
    With sh
        .Name = shName
        .Fill.ForeColor.RGB = farbe
        .Line.Visible = msoFalse
        .OnAction = makro
        With .TextFrame2.TextRange
            .Text = beschriftung
            .Font.Size = 11
            .Font.Bold = msoTrue
            .Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        End With
    End With
End Sub

'==========================================================================
'  4) Diagnose - zeigt, was wirklich zurueckkommt
'==========================================================================
Public Sub Diagnose()
    Dim tn As String, dl As String, cc As Long
    Dim fehler As String, r1 As String, r2 As String

    tn = Trim$(InputBox("Sendungsnummer zum Testen:", "17TRACK Diagnose"))
    If tn = "" Then Exit Sub
    dl = Trim$(InputBox("Dienstleister (leer lassen = 17TRACK soll selbst erkennen):", _
                        "17TRACK Diagnose"))
    cc = CarrierCode(dl)

    If cc > 0 Then
        r1 = HttpPost("register", "[{""number"":""" & tn & """,""carrier"":" & cc & "}]", fehler)
    Else
        r1 = HttpPost("register", "[{""number"":""" & tn & """,""auto_detection"":true}]", fehler)
    End If
    If fehler <> "" Then r1 = "FEHLER: " & fehler
    Pause 1.5
    r2 = HttpPost("gettrackinfo", "[{""number"":""" & tn & """}]", fehler)
    If fehler <> "" Then r2 = "FEHLER: " & fehler

    Dim f As String, fn As Integer, ordner As String
    ordner = ThisWorkbook.Path
    If ordner = "" Then ordner = Environ$("TEMP")      ' Mappe noch nie gespeichert
    f = ordner & "\17track-diagnose.txt"

    On Error GoTo KeinSchreibzugriff
    fn = FreeFile
    Open f For Output As #fn
    Print #fn, "Nummer:        " & tn
    Print #fn, "Dienstleister: " & dl & "  -> Carrier-Code " & cc
    Print #fn, "Key gesetzt:   " & CStr(TOKEN <> "HIER_NEUEN_17TRACK_KEY_EINTRAGEN") & _
               "  (Laenge " & Len(TOKEN) & ")"
    Print #fn, ""
    Print #fn, "--- register ---"
    Print #fn, r1
    Print #fn, ""
    Print #fn, "--- gettrackinfo ---"
    Print #fn, r2
    Close #fn
    On Error GoTo 0

    MsgBox "Carrier-Code: " & cc & vbLf & vbLf & _
           "register:" & vbLf & Left$(r1, 350) & vbLf & vbLf & _
           "gettrackinfo:" & vbLf & Left$(r2, 550) & vbLf & vbLf & _
           "Komplette Antwort gespeichert in:" & vbLf & f, _
           vbInformation, "17TRACK Diagnose"
    Exit Sub

KeinSchreibzugriff:
    MsgBox "Carrier-Code: " & cc & vbLf & vbLf & _
           "register:" & vbLf & Left$(r1, 400) & vbLf & vbLf & _
           "gettrackinfo:" & vbLf & Left$(r2, 700), _
           vbInformation, "17TRACK Diagnose"
End Sub

'==========================================================================
'  Hilfsfunktionen
'==========================================================================
Private Sub Aufraeumen()
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableEvents = True
End Sub

Private Function HoleBlatt() As Worksheet
    On Error Resume Next
    Set HoleBlatt = ThisWorkbook.Sheets(SHEETNAME)
    On Error GoTo 0
    If HoleBlatt Is Nothing Then
        MsgBox "Blatt '" & SHEETNAME & "' nicht gefunden.", vbExclamation
    End If
End Function

' Spalten anhand der Ueberschriften in Zeile 1 finden
Private Function SpaltenSuchen(ws As Worksheet) As Boolean
    cNum = 0: cDL = 0: cPlan = 0: cEta = 0
    cStat = 0: cAmp = 0: cUpd = 0: cLink = 0: cPuf = 0

    Dim c As Long, h As String, lastCol As Long
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    For c = 1 To lastCol
        h = LCase$(Trim$(CStr(ws.Cells(1, c).Value)))
        If h <> "" Then
            If InStr(h, "17track") > 0 Or InStr(h, "link") > 0 Then
                cLink = c
            ElseIf InStr(h, "puffer") > 0 Then
                cPuf = c
            ElseIf InStr(h, "sendungsnummer") > 0 Or InStr(h, "tracking") > 0 Then
                cNum = c
            ElseIf InStr(h, "dienstleister") > 0 Or InStr(h, "versand") > 0 _
                Or InStr(h, "carrier") > 0 Then
                cDL = c
            ElseIf InStr(h, "geplant") > 0 Or InStr(h, "wunschtermin") > 0 Then
                cPlan = c
            ElseIf InStr(h, "voraussichtl") > 0 Then
                cEta = c
            ElseIf InStr(h, "status") > 0 Then
                cStat = c
            ElseIf InStr(h, "ampel") > 0 Then
                cAmp = c
            ElseIf InStr(h, "zuletzt") > 0 Then
                cUpd = c
            End If
        End If
    Next c

    If cNum = 0 Then
        MsgBox "In Zeile 1 wurde keine Spalte 'Sendungsnummer' gefunden." & vbLf & _
               "Bitte die Ueberschrift genau so schreiben.", vbExclamation
        SpaltenSuchen = False
    Else
        SpaltenSuchen = True
    End If
End Function

' Nummer sauber als Text lesen; repariert 1,23457E+19 und schreibt zurueck
Private Function NummerLesen(c As Range, ByRef warn As String) As String
    warn = ""
    If IsEmpty(c.Value2) Then Exit Function
    If IsError(c.Value2) Then                     ' #NV, #WERT! usw.
        warn = "Fehlerwert in der Zelle"
        NummerLesen = "#FEHLER"
        Exit Function
    End If

    Dim s As String, istZahl As Boolean, roh As String, evAlt As Boolean
    Select Case VarType(c.Value2)
        Case vbDouble, vbSingle, vbLong, vbInteger, vbCurrency, vbDecimal
            istZahl = True
            s = Format$(c.Value2, "0")            ' erzwingt Vollschreibweise
            If Len(s) > 15 Then
                warn = "war eine Zahl mit mehr als 15 Stellen, Ziffern verfaelscht"
            End If
        Case Else
            s = CStr(c.Value2)
    End Select

    roh = s
    s = Replace(s, Chr$(160), "")                 ' geschuetztes Leerzeichen
    s = Replace(s, vbTab, "")
    s = Replace(s, " ", "")
    s = UCase$(Trim$(s))
    If s = "" Then Exit Function
    If InStr(s, "E+") > 0 Then warn = "Exponentialschreibweise, Nummer unbrauchbar"

    ' bereinigten Wert als Text zurueckschreiben
    If istZahl Or roh <> s Then
        evAlt = Application.EnableEvents
        Application.EnableEvents = False
        c.NumberFormat = "@"
        c.Value = s
        Application.EnableEvents = evAlt
    End If

    NummerLesen = s
End Function

Private Sub SchreibZelle(ws As Worksheet, r As Long, col As Long, v As String)
    If col > 0 Then ws.Cells(r, col).Value = v
End Sub

Private Sub SetzeLink(ws As Worksheet, r As Long, tn As String)
    If cLink = 0 Then Exit Sub
    Dim url As String, cc As Long
    cc = 0
    If cDL > 0 Then cc = CarrierCode(CStr(ws.Cells(r, cDL).Value))
    url = "https://t.17track.net/de#nums=" & tn
    If cc > 0 Then url = url & "&fc=" & cc
    On Error Resume Next
    ws.Cells(r, cLink).Hyperlinks.Delete
    ws.Hyperlinks.Add Anchor:=ws.Cells(r, cLink), Address:=url, TextToDisplay:="oeffnen"
    On Error GoTo 0
End Sub

' ---- HTTP POST; fehler <> "" heisst: Antwort unbrauchbar ---------------
Private Function HttpPost(endpoint As String, body As String, ByRef fehler As String) As String
    Dim http As Object, resp As String, topCode As Long
    fehler = ""
    On Error GoTo Netzfehler
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 5000, 15000, 15000, 30000
    http.Open "POST", APIBASE & endpoint, False
    http.setRequestHeader "17token", TOKEN
    http.setRequestHeader "Content-Type", "application/json"
    http.send body
    resp = http.responseText

    If http.status <> 200 Then
        fehler = "HTTP " & http.status & " " & http.statusText & vbLf & Left$(resp, 300)
        Exit Function
    End If

    ' 17TRACK antwortet auch bei Fehlern mit HTTP 200 -> code pruefen.
    ' Nur der code VOR dem "data"-Block ist der globale Statuscode. Fehler
    ' einzelner Nummern stehen in data.rejected und haben ebenfalls einen
    ' "code" - der darf den ganzen Lauf nicht abbrechen.
    Dim pData As Long, pCode As Long
    pData = InStr(1, resp, """data""")
    pCode = InStr(1, resp, """code"":")
    If pCode > 0 Then
        If pData = 0 Or pCode < pData Then
            topCode = JsonNum(resp, "code", 1)
            If topCode <> 0 Then
                fehler = "code " & topCode & ": " & JsonStr(resp, "message", 1) & _
                         vbLf & Left$(resp, 300)
                Exit Function
            End If
        End If
    End If

    HttpPost = resp
    Exit Function

Netzfehler:
    fehler = "Verbindung fehlgeschlagen: " & Err.Description
End Function

' ---- Wert eines Textfeldes "key":"wert" ab Position startAt ------------
Private Function JsonStr(s As String, key As String, Optional startAt As Long = 1) As String
    Dim p As Long, q As Long
    If startAt < 1 Then startAt = 1
    p = InStr(startAt, s, """" & key & """:""")
    If p = 0 Then Exit Function
    p = p + Len(key) + 4
    q = InStr(p, s, """")
    If q = 0 Then Exit Function
    JsonStr = Mid$(s, p, q - p)
End Function

' ---- Wert eines Zahlenfeldes "key":123 ab Position startAt -------------
Private Function JsonNum(s As String, key As String, Optional startAt As Long = 1) As Long
    Dim p As Long, q As Long, t As String
    If startAt < 1 Then Exit Function
    p = InStr(startAt, s, """" & key & """:")
    If p = 0 Then Exit Function
    p = p + Len(key) + 3
    q = p
    Do While q <= Len(s)
        If InStr("-0123456789", Mid$(s, q, 1)) = 0 Then Exit Do
        q = q + 1
    Loop
    t = Mid$(s, p, q - p)
    If t <> "" And t <> "-" Then
        If IsNumeric(t) Then JsonNum = CLng(t)
    End If
End Function

' ---- ISO-Zeitstempel -> echtes Datum (0 = keins) ----------------------
Private Function IsoToDate(iso As String) As Date
    If Len(iso) < 10 Then Exit Function
    If Mid$(iso, 5, 1) <> "-" Or Mid$(iso, 8, 1) <> "-" Then Exit Function
    Dim j As String, mo As String, t As String
    j = Left$(iso, 4): mo = Mid$(iso, 6, 2): t = Mid$(iso, 9, 2)
    If Not (IsNumeric(j) And IsNumeric(mo) And IsNumeric(t)) Then Exit Function
    On Error Resume Next
    IsoToDate = DateSerial(CInt(j), CInt(mo), CInt(t))
    On Error GoTo 0
End Function

Private Sub Pause(sec As Single)
    Dim t As Single
    t = Timer
    Do While Timer - t < sec
        DoEvents
        If Timer < t Then Exit Do
    Loop
End Sub

'==========================================================================
'  Carrier-Zuordnung (offizielle 17TRACK Carrier-Keys)
'  Wird nur gebraucht, wenn du den Dienstleister von Hand eintraegst
'  oder fuer den 17TRACK-Link.
'==========================================================================
Private Function DienstleisterListe() As Variant
    DienstleisterListe = Array( _
        "DHL Paket", "DHL Express", "DHL Freight", "DHL Global Forwarding", _
        "DHL ACTIVETRACING", "Deutsche Post", "UPS", "FedEx", "TNT", "GLS", _
        "DPD", "Hermes", "DB Schenker", "DACHSER", "GO Express", _
        "Kuehne+Nagel", "DSV", "GEODIS", "Swiss Post", "Austrian Post", _
        "Royal Mail", "USPS", "Sonstige")
End Function

Private Function CarrierCode(ByVal s As String) As Long
    s = UCase$(Trim$(s))
    s = Replace(s, "-", " ")
    s = Replace(s, ".", "")
    If s = "" Then Exit Function

    Select Case True
        Case s Like "DHL EXPRESS*":     CarrierCode = 100001
        Case s Like "DHL FREIGHT*":     CarrierCode = 100245
        Case s Like "DHL GLOBAL*":      CarrierCode = 100766
        Case s Like "DHL ACTIVE*":      CarrierCode = 100216
        Case s Like "DHL*":             CarrierCode = 7041
        Case s Like "DEUTSCHE POST*":   CarrierCode = 7044
        Case s Like "UPS*":             CarrierCode = 100002
        Case s Like "FEDEX*":           CarrierCode = 100003
        Case s Like "TNT*":             CarrierCode = 100004
        Case s Like "GLS*":             CarrierCode = 101070
        Case s Like "DPD*":             CarrierCode = 100007
        Case s Like "HERMES*":          CarrierCode = 100031
        Case s Like "*SCHENKER*":       CarrierCode = 100206
        Case s Like "DACHSER*":         CarrierCode = 100342
        Case s Like "GO*EXPRESS*":      CarrierCode = 100963
        Case s Like "KUEHNE*":          CarrierCode = 100164
        Case s Like "KUHNE*":           CarrierCode = 100164
        Case s Like "DSV*":             CarrierCode = 100186
        Case s Like "GEODIS*":          CarrierCode = 100356
        Case s Like "SWISS POST*":      CarrierCode = 19251
        Case s Like "AUSTRIAN POST*":   CarrierCode = 1161
        Case s Like "ROYAL MAIL*":      CarrierCode = 11031
        Case s Like "USPS*":            CarrierCode = 21051
        Case Else:                      CarrierCode = 0
    End Select
End Function

Private Function CarrierName(ByVal code As Long) As String
    Select Case code
        Case 7041:           CarrierName = "DHL Paket"
        Case 100001:         CarrierName = "DHL Express"
        Case 100245:         CarrierName = "DHL Freight"
        Case 100766:         CarrierName = "DHL Global Forwarding"
        Case 100216:         CarrierName = "DHL ACTIVETRACING"
        Case 7044:           CarrierName = "Deutsche Post"
        Case 100002:         CarrierName = "UPS"
        Case 100003:         CarrierName = "FedEx"
        Case 100004:         CarrierName = "TNT"
        Case 101070, 100005: CarrierName = "GLS"
        Case 100007:         CarrierName = "DPD"
        Case 100031, 100018: CarrierName = "Hermes"
        Case 100206:         CarrierName = "DB Schenker"
        Case 100342:         CarrierName = "DACHSER"
        Case 100963:         CarrierName = "GO Express"
        Case 100164:         CarrierName = "Kuehne+Nagel"
        Case 100186:         CarrierName = "DSV"
        Case 100356:         CarrierName = "GEODIS"
        Case 19251:          CarrierName = "Swiss Post"
        Case 1161:           CarrierName = "Austrian Post"
        Case 11031:          CarrierName = "Royal Mail"
        Case 21051:          CarrierName = "USPS"
        Case Else:           CarrierName = ""
    End Select
End Function
