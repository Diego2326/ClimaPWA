<script>
  import { onMount } from 'svelte'

  const defaultPlace = {
    name: 'Ciudad de Guatemala',
    country: 'Guatemala',
    latitude: 14.6349,
    longitude: -90.5069,
  }

  const descriptions = {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla', 51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna intensa',
    61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia intensa', 71: 'Nieve ligera',
    73: 'Nieve', 75: 'Nieve intensa', 80: 'Chubascos', 81: 'Chubascos', 82: 'Chubascos intensos',
    95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta intensa',
  }

  let query = defaultPlace.name
  let place = defaultPlace
  let weather = null
  let loading = false
  let error = ''

  $: current = weather?.current
  $: daily = weather?.daily

  onMount(() => {
    loadWeather(defaultPlace)
  })

  function weatherDescription(code) {
    return descriptions[code] ?? 'Clima variable'
  }

  function dayName(date, index) {
    if (index === 0) return 'Hoy'
    return new Intl.DateTimeFormat('es', { weekday: 'short' })
      .format(new Date(`${date}T12:00:00`))
      .replace('.', '')
  }

  async function loadWeather(nextPlace) {
    loading = true
    error = ''
    try {
      const params = new URLSearchParams({
        latitude: String(nextPlace.latitude),
        longitude: String(nextPlace.longitude),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        forecast_days: '5',
        timezone: 'auto',
      })
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!response.ok) throw new Error('No se pudo cargar el clima.')
      weather = await response.json()
      place = nextPlace
    } catch {
      error = 'No se pudo cargar el clima. Revisa tu conexión e inténtalo de nuevo.'
    } finally {
      loading = false
    }
  }

  async function searchCity(event) {
    event.preventDefault()
    const name = query.trim()
    if (!name) return

    loading = true
    error = ''
    try {
      const params = new URLSearchParams({ name, count: '1', language: 'es', format: 'json' })
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
      if (!response.ok) throw new Error()
      const result = await response.json()
      const match = result.results?.[0]
      if (!match) {
        error = `No encontramos “${name}”. Prueba con otra ciudad.`
        return
      }

      const nextPlace = {
        name: match.name,
        country: match.country ?? '',
        latitude: match.latitude,
        longitude: match.longitude,
      }
      query = nextPlace.name
      await loadWeather(nextPlace)
    } catch {
      error = 'No se pudo buscar la ciudad. Revisa tu conexión e inténtalo de nuevo.'
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Clima</title>
</svelte:head>

<main class="app">
  <header>
    <a class="brand" href="/">☁ Clima</a>
  </header>

  <section class="search-section">
    <h1>¿Qué tiempo hace?</h1>
    <form onsubmit={searchCity}>
      <input bind:value={query} aria-label="Ciudad" placeholder="Escribe una ciudad" />
      <button type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Buscar'}</button>
    </form>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </section>

  {#if weather && current}
    <section class="current" aria-live="polite">
      <div class="current-heading">
        <div>
          <p class="label">CLIMA ACTUAL</p>
          <h2>{place.name}{place.country ? `, ${place.country}` : ''}</h2>
        </div>
        <p class="condition">{weatherDescription(current.weather_code)}</p>
      </div>

      <div class="temperature">{Math.round(current.temperature_2m)}<span>°C</span></div>

      <div class="details">
        <p>Sensación <strong>{Math.round(current.apparent_temperature)}°</strong></p>
        <p>Humedad <strong>{current.relative_humidity_2m}%</strong></p>
        <p>Viento <strong>{Math.round(current.wind_speed_10m)} {weather.current_units.wind_speed_10m}</strong></p>
      </div>
    </section>

    <section class="forecast">
      <h2>Pronóstico de 5 días</h2>
      <div class="forecast-list">
        {#each daily.time as date, index (date)}
          <article class="forecast-day">
            <span>{dayName(date, index)}</span>
            <span class="forecast-condition">{weatherDescription(daily.weather_code[index])}</span>
            <strong>{Math.round(daily.temperature_2m_max[index])}°</strong>
            <span class="low">{Math.round(daily.temperature_2m_min[index])}°</span>
          </article>
        {/each}
      </div>
    </section>
  {:else if loading}
    <p class="loading">Cargando datos del clima…</p>
  {/if}

  <footer>Datos de <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></footer>
</main>
