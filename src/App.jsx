  <header className="hero">
    <div className="hero-copy">
      <p className="eyebrow">Founders Fund</p>
      <h1>Time-weighted profit split &amp; AI insight center</h1>
      <p className="muted">
        Based on capital-days and a configurable carry on Laura &amp; Damon profits (carry routes to Founders). Damon can be
        toggled between deployed or not deployed. The AI query hub can parse Figment screenshots, auto-populate the advanced
        metrics, and draft an executive report backed by ChatGPT-compatible models.
      </p>
    </div>
  </header>

  <div className="tabs" role="tablist" aria-label="Application views">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        id={`${tab.key}-tab`}
        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
        aria-selected={activeTab === tab.key}
        aria-controls={`${tab.key}-panel`}
        onClick={() => setActiveTab(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {activeTab === 'calculator' ? (
    <div className="layout" role="tabpanel" id="calculator-panel" aria-labelledby="calculator-tab">
      <section className="panel inputs">
        <h2>Allocation inputs</h2>
        <p className="muted">
          Set the realized profit, the carry percentage allocated to Founders, and Damon&apos;s deployment status. Recalculate to lock
          values within their allowed ranges.
        </p>

        <div className="grid">
          <div className="field">
            <label htmlFor="profitInput">Profit (P)</label>
            <input
              id="profitInput"
              type="number"
              step="1"
              min="0"
              value={profitInput}
              onChange={handleProfitChange}
              onBlur={handleProfitBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="carryInput">Carry on Laura &amp; Damon (%)</label>
            <input
              id="carryInput"
              type="number"
              step="1"
              min="0"
              max="100"
              value={carryInput}
              onChange={handleCarryChange}
              onBlur={handleCarryBlur}
            />
          </div>

          <div className="field">
            <label htmlFor="scenario">Damon status</label>
            <select id="scenario" value={scenario} onChange={handleScenarioChange} aria-describedby="scenarioDescription">
              {SCENARIOS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="help muted" id="scenarioDescription">
              {scenarioDetails.summary}
            </p>
          </div>
        </div>

        <div className="weights muted" aria-live="polite">
          Capital-day weights → Founders: {formatPercent(weights.F)} ({capitalDays.F.toFixed(0)} units), Laura:{' '}
          {formatPercent(weights.L)} ({capitalDays.L.toFixed(0)} units), Damon: {formatPercent(weights.D)} ({capitalDays.D.toFixed(0)}
          {' '}units) (sum {(totalWeight * 100).toFixed(2)}%, total {totalCapitalDays.toFixed(0)} units)
        </div>
      </section>

      <section className="panel results">
        <h2>Distribution overview</h2>
        <p className="muted">
          Scenario: <span className="pill">{scenarioDetails.label}</span>
        </p>
        <p className="muted">
          Investor-class weights for this snapshot come from the section below. Use the entry, management, and moonbag inputs
          to align Founders, Laura, and Damon allocations with the current calculator state.
        </p>

        <div className="legend" role="list" aria-label="Party color legend">
          {PARTIES.map((party) => {
            const weightKey = PARTY_WEIGHT_KEYS[party.key]
            return (
              <span key={party.key} className="lg" role="listitem">
                <span className={`sw ${party.className}`} aria-hidden="true" />
                <span>
                  {party.label} • Weight {formatPercent(weights[weightKey])}
                </span>
              </span>
            )
          })}
        </div>

        <p className="muted" aria-live="polite">
          Net allocations reflect carry plus an {formatPercent(breakdown.entryFeeRate)} entry fee and{' '}
          {formatPercent(breakdown.managementFeeRate)} management fee that route investor dollars to Founders.
        </p>

        <div className="stat-cards">
          {PARTIES.map((party) => {
            const value = partyValues[party.key]
            const share = partyShares[party.key]
            const weightKey = PARTY_WEIGHT_KEYS[party.key]
            const weightValue = weights[weightKey]
            const partyBreakdown = breakdown[party.key]
            const isFounders = party.key === 'founders'
            const description = isFounders
              ? 'Base share plus carry, entry, and management fees routed from investors.'
              : 'Net after carry, entry, and management fees routed to Founders.'
            return (
              <article key={party.key} className={`stat-card ${party.className}`}>
                <header className="stat-header">{party.label}</header>
                <div className="stat-amount">{formatCurrency(value)}</div>
                <p className="stat-description">{description}</p>
                <dl className="stat-meta">
                  <div>
                    <dt>Capital weight</dt>
                    <dd>{formatPercent(weightValue)}</dd>
                  </div>
                  <div>
                    <dt>Share of profit</dt>
                    <dd>{formatPercent(share)}</dd>
                  </div>
                  {party.key === 'founders' ? (
                    <>
                      <div>
                        <dt>Carry captured</dt>
                        <dd>{formatCurrency(allocation.carryBreakdown.total)}</dd>
                      </div>
                      {allocation.founders.routedFromDamon > 0 ? (
                        <div>
                          <dt>Routed from Damon</dt>
                          <dd>{formatCurrency(allocation.founders.routedFromDamon)}</dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {party.key === 'laura' ? (
                    <>
                      <div>
                        <dt>Gross before carry</dt>
                        <dd>{formatCurrency(allocation.investorBreakdown.laura.gross)}</dd>
                      </div>
                      <div>
                        <dt>Carry paid</dt>
                        <dd>{formatCurrency(allocation.investorBreakdown.laura.carry)}</dd>
                      </div>
                    </>
                  ) : null}
                  {party.key === 'damon'
                    ? scenarioDetails.damonDeployed
                      ? (
                          <>
                            <div>
                              <dt>Gross before carry</dt>
                              <dd>{formatCurrency(allocation.investorBreakdown.damon.effectiveGross)}</dd>
                            </div>
                            <div>
                              <dt>Carry paid</dt>
                              <dd>{formatCurrency(allocation.investorBreakdown.damon.carry)}</dd>
                            </div>
                          </>
                        )
                      : (
                          <div>
                            <dt>Routed to Founders</dt>
                            <dd>{formatCurrency(allocation.investorBreakdown.damon.routedToFounders)}</dd>
                          </div>
                        )
                    : null}
                </dl>
                <dl className="stat-breakdown">
                  {isFounders ? (
                    <>
                      <div>
                        <dt>Base share</dt>
                        <dd>{formatCurrency(partyBreakdown.base)}</dd>
                      </div>
                      <div>
                        <dt>Carry intake ({formatPercent(breakdown.carryRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.carry)}</dd>
                      </div>
                      <div>
                        <dt>Entry fees ({formatPercent(breakdown.entryFeeRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.entryFee)}</dd>
                      </div>
                      <div>
                        <dt>Mgmt fees ({formatPercent(breakdown.managementFeeRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.managementFee)}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Gross before carry</dt>
                        <dd>{formatCurrency(partyBreakdown.gross)}</dd>
                      </div>
                      <div>
                        <dt>Carry to Founders ({formatPercent(breakdown.carryRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.carry)}</dd>
                      </div>
                      <div>
                        <dt>Realized pre-fees</dt>
                        <dd>{formatCurrency(partyBreakdown.realizedBeforeFees)}</dd>
                      </div>
                      <div>
                        <dt>Entry fee to Founders ({formatPercent(breakdown.entryFeeRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.entryFee)}</dd>
                      </div>
                      <div>
                        <dt>Mgmt fee to Founders ({formatPercent(breakdown.managementFeeRate)})</dt>
                        <dd>{formatCurrency(partyBreakdown.managementFee)}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </article>
            )
          })}
        </div>

        <div className="bars" role="list" aria-label="Profit share by party">
          {PARTIES.map((party) => {
            const value = partyValues[party.key]
            const width = total > 0 ? (value / total) * 100 : 0
            return (
              <div className="bar-row" role="listitem" key={party.key}>
                <div className="bar-label">{party.label}</div>
                <div className="bar-track" aria-hidden="true">
                  <div className={`bar-fill ${party.className}`} style={{ width: `${width}%` }} />
                </div>
                <div className="bar-value">{formatCurrency(value)}</div>
              </div>
            )
          })}
        </div>

        <div className="stacked">
          <div className="bar-row">
            <div className="bar-label">Stacked (Total Profit)</div>
            <div className="bar-track" aria-hidden="true">
              <div
                className="segment founders"
                style={{ width: `${total > 0 ? (partyValues.founders / total) * 100 : 0}%` }}
              />
              <div
                className="segment laura"
                style={{ width: `${total > 0 ? (partyValues.laura / total) * 100 : 0}%` }}
              />
              <div
                className="segment damon"
                style={{ width: `${total > 0 ? (partyValues.damon / total) * 100 : 0}%` }}
              />
            </div>
            <div className="bar-value">{formatCurrency(total)}</div>
          </div>
        </div>

        <div className="formulas muted" aria-live="polite">
          <div className="formula-head">Allocation flow</div>
          <ul>
            <li>
              Gross share starts at P×W<sub>i</sub> for each party before fees.
            </li>
            <li>
              Founders collect {formatPercent(breakdown.carryRate)} carry on Laura and Damon&apos;s gross allocations.
            </li>
            <li>
              Realized investor profit pays a {formatPercent(breakdown.entryFeeRate)} entry fee routed to Founders.
            </li>
            <li>
              The post-entry balance pays a {formatPercent(breakdown.managementFeeRate)} management fee that also routes to
              Founders.
            </li>
          </ul>
        </div>
      </section>
      <AdvancedFieldsSection
        title="Investor class allocations"
        description="Assign snapshot dollars, dates, and weights for the entry, management, and moonbag classes. These values drive the allocations that flow to Founders, Laura, and Damon."
        advancedInputs={advancedInputs}
        weightInputs={weightInputs}
        normalizedWeights={normalizedWeights}
        weightSum={weightSum}
        advancedDistribution={advancedDistribution}
        advancedNumbers={advancedNumbers}
        combinedProfit={combinedProfit}
        netAdvancedProfit={netAdvancedProfit}
        feeBreakdown={feeBreakdown}
        roi={roi}
        netRoi={netRoi}
        winRate={0}
        lossRate={0}
        profitPerTrade={profitPerTrade}
        moonshotDistribution={moonshotDistribution}
        onAdvancedChange={handleAdvancedChange}
        onAdvancedBlur={handleAdvancedBlur}
        onWeightChange={handleWeightChange}
        onWeightBlur={handleWeightBlur}
        damonDeployed={scenarioDetails.damonDeployed}
        isWide
      />
    </div>
  ) : (
    <div className="ai-layout" role="tabpanel" id="ai-panel" aria-labelledby="ai-tab">
      <section className="panel ai-panel">
        <h2>Upload &amp; OCR</h2>
        <p className="muted">
          Drop a Figment dashboard screenshot to automatically extract wallet size, PnL, trade counts, and carry. All OCR runs in the
          browser via Tesseract.js.
        </p>
        <div className="ai-options" role="group" aria-label="AI extraction options">
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={useAiVision}
              onChange={(event) => setUseAiVision(event.target.checked)}
            />
            <span>
              <strong>Use AI vision extraction</strong>
              <span className="muted">
                Skip on-device OCR and let your BYOK model extract structured values directly from the screenshot.
              </span>
            </span>
          </label>
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={useAiExtraction}
              onChange={(event) => setUseAiExtraction(event.target.checked)}
            />
            <span>
              <strong>Enhance OCR with AI JSON mode</strong>
              <span className="muted">
                Run Tesseract locally, then merge any non-null fields returned by your BYOK chat model.
              </span>
            </span>
          </label>
        </div>
        <label className={`upload-zone ${ocrStatus === 'processing' ? 'uploading' : ''}`}>
          <input type="file" accept="image/*" onChange={handleOcrUpload} />
          <span>
            <strong>Click to upload</strong>
            <span className="muted">PNG, JPG, and GIF files supported. Drag &amp; drop is welcome.</span>
          </span>
        </label>
        {ocrStatus === 'processing' ? (
          <div className="progress" role="status" aria-live="polite">
            <div className="progress-track" aria-hidden="true">
              <div className="progress-bar" style={{ width: `${ocrProgress}%` }} />
            </div>
            <span className="progress-text">Recognizing text… {ocrProgress}%</span>
          </div>
        ) : null}
        {ocrStatus === 'done' ? (
          <p className="muted" role="status">
            OCR complete. Review the extracted metrics below and adjust anything that needs refinement.
          </p>
        ) : null}
        {ocrStatus === 'error' ? (
          <p className="error-text" role="alert">
            {ocrError}
          </p>
        ) : null}
        {uploadedImage ? (
          <div className="preview">
            <img src={uploadedImage} alt="Uploaded Figment screenshot" className="ocr-preview" />
          </div>
        ) : null}
        {ocrText ? (
          <div className="ocr-output-wrapper">
            <label htmlFor="ocrText" className="muted">
              Raw OCR output
            </label>
            <textarea id="ocrText" className="ocr-output" value={ocrText} readOnly />
          </div>
        ) : null}
        <div className="upload-actions">
          <button type="button" className="btn ghost" onClick={handleResetOcr}>
            Reset OCR data
          </button>
          <button type="button" className="btn primary" onClick={applyPnlToCalculator}>
            Apply to calculator inputs
          </button>
        </div>
      </section>

      <AdvancedFieldsSection
        title="Advanced calculator fields"
        description="Values pulled from OCR are editable. Adjust the distribution weights to drive the entry, management, and moonbag allocations that route dollars to each investor class."
        advancedInputs={advancedInputs}
        weightInputs={weightInputs}
        normalizedWeights={normalizedWeights}
        advancedDistribution={advancedDistribution}
        advancedNumbers={advancedNumbers}
        combinedProfit={combinedProfit}
        roi={roi}
        winRate={0}
        lossRate={0}
        profitPerTrade={profitPerTrade}
        onAdvancedChange={handleAdvancedChange}
        onAdvancedBlur={handleAdvancedBlur}
        onWeightChange={handleWeightChange}
        onWeightBlur={handleWeightBlur}
        isWide
      />

      <section className="panel ai-panel">
        <h2>AI-generated executive report</h2>
        <p className="muted">
          Use your own OpenAI-compatible API key. Nothing is sent until you press generate. Responses are stored only in this browser
          session.
        </p>
        <div className="advanced-grid ai-config">
          <div className="field">
            <label htmlFor="aiKey">API key</label>
            <input
              id="aiKey"
              type="password"
              value={aiKey}
              onChange={(event) => setAiKey(event.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="field">
            <label htmlFor="aiBaseUrl">Base URL</label>
            <input
              id="aiBaseUrl"
              type="text"
              value={aiBaseUrl}
              onChange={(event) => setAiBaseUrl(event.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="field">
            <label htmlFor="aiModel">Model</label>
            <input
              id="aiModel"
              type="text"
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>
          <div className="field">
            <label htmlFor="aiTemperature">Temperature</label>
            <input
              id="aiTemperature"
              type="text"
              inputMode="decimal"
              value={aiTemperature}
              onChange={(event) => setAiTemperature(event.target.value)}
              placeholder="0.2"
            />
          </div>
        </div>
        <div className="ai-report">
          <label htmlFor="aiReport" className="muted">
            Executive report draft
          </label>
          <textarea
            id="aiReport"
            value={aiReport}
            onChange={(event) => setAiReport(event.target.value)}
            placeholder="Generate a report to populate this area."
          />
        </div>
        {aiError ? (
          <p className="error-text" role="alert">
            {aiError}
          </p>
        ) : null}
        {aiStatus === 'loading' ? (
          <p className="muted" role="status">
            Generating executive summary…
          </p>
        ) : null}
        <div className="upload-actions">
          <button
            type="button"
            className="btn primary"
            onClick={handleGenerateReport}
            disabled={aiStatus === 'loading'}
          >
            {aiStatus === 'loading' ? 'Working…' : 'Generate executive report'}
          </button>
        </div>
      </section>
    </div>
  )}
</div>
