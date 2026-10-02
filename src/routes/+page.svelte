<script lang="ts">
  import { getLocalTimeZone, today } from '@internationalized/date'
  import { BarChart } from 'layerchart'
  import { toast } from 'svelte-sonner'
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4, zod4Client } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'

  import AudioLinesIcon from '@lucide/svelte/icons/audio-lines'
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import FileMusicIcon from '@lucide/svelte/icons/file-music'
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import HeartIcon from '@lucide/svelte/icons/heart'
  import InfoIcon from '@lucide/svelte/icons/info'
  import LibraryIcon from '@lucide/svelte/icons/library'
  import ListMusicIcon from '@lucide/svelte/icons/list-music'
  import MicIcon from '@lucide/svelte/icons/mic'
  import MusicIcon from '@lucide/svelte/icons/music'
  import PauseIcon from '@lucide/svelte/icons/pause'
  import PlayIcon from '@lucide/svelte/icons/play'
  import RepeatIcon from '@lucide/svelte/icons/repeat'
  import SearchIcon from '@lucide/svelte/icons/search'
  import SettingsIcon from '@lucide/svelte/icons/settings'
  import StarIcon from '@lucide/svelte/icons/star'
  import TimerIcon from '@lucide/svelte/icons/timer'
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert'
  import UploadIcon from '@lucide/svelte/icons/upload'
  import Volume2Icon from '@lucide/svelte/icons/volume-2'

  import * as Accordion from '#lib/components/ui/accordion'
  import * as Alert from '#lib/components/ui/alert'
  import * as AlertDialog from '#lib/components/ui/alert-dialog'
  import { AspectRatio } from '#lib/components/ui/aspect-ratio'
  import * as Attachment from '#lib/components/ui/attachment'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Badge } from '#lib/components/ui/badge'
  import * as Breadcrumb from '#lib/components/ui/breadcrumb'
  import * as Bubble from '#lib/components/ui/bubble'
  import { Button, buttonVariants } from '#lib/components/ui/button'
  import * as ButtonGroup from '#lib/components/ui/button-group'
  import { Calendar } from '#lib/components/ui/calendar'
  import * as Card from '#lib/components/ui/card'
  import * as Carousel from '#lib/components/ui/carousel'
  import * as Chart from '#lib/components/ui/chart'
  import { Checkbox } from '#lib/components/ui/checkbox'
  import * as Collapsible from '#lib/components/ui/collapsible'
  import * as Command from '#lib/components/ui/command'
  import * as ContextMenu from '#lib/components/ui/context-menu'
  import * as Dialog from '#lib/components/ui/dialog'
  import * as Drawer from '#lib/components/ui/drawer'
  import * as DropdownMenu from '#lib/components/ui/dropdown-menu'
  import * as Empty from '#lib/components/ui/empty'
  import * as Field from '#lib/components/ui/field'
  import * as Form from '#lib/components/ui/form'
  import * as HoverCard from '#lib/components/ui/hover-card'
  import { Input } from '#lib/components/ui/input'
  import * as InputGroup from '#lib/components/ui/input-group'
  import * as InputOTP from '#lib/components/ui/input-otp'
  import * as Item from '#lib/components/ui/item'
  import * as Kbd from '#lib/components/ui/kbd'
  import { Label } from '#lib/components/ui/label'
  import * as Marker from '#lib/components/ui/marker'
  import * as Menubar from '#lib/components/ui/menubar'
  import * as Message from '#lib/components/ui/message'
  import * as NativeSelect from '#lib/components/ui/native-select'
  import * as NavigationMenu from '#lib/components/ui/navigation-menu'
  import * as Pagination from '#lib/components/ui/pagination'
  import * as Popover from '#lib/components/ui/popover'
  import { Progress } from '#lib/components/ui/progress'
  import * as RadioGroup from '#lib/components/ui/radio-group'
  import { RangeCalendar } from '#lib/components/ui/range-calendar'
  import * as Resizable from '#lib/components/ui/resizable'
  import { ScrollArea } from '#lib/components/ui/scroll-area'
  import * as Select from '#lib/components/ui/select'
  import { Separator } from '#lib/components/ui/separator'
  import * as Sheet from '#lib/components/ui/sheet'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Skeleton } from '#lib/components/ui/skeleton'
  import { Slider } from '#lib/components/ui/slider'
  import { Spinner } from '#lib/components/ui/spinner'
  import { Switch } from '#lib/components/ui/switch'
  import * as Table from '#lib/components/ui/table'
  import * as Tabs from '#lib/components/ui/tabs'
  import { Textarea } from '#lib/components/ui/textarea'
  import { Toggle } from '#lib/components/ui/toggle'
  import * as ToggleGroup from '#lib/components/ui/toggle-group'
  import * as Tooltip from '#lib/components/ui/tooltip'

  // --- sample data ---------------------------------------------------------

  const songs = [
    { title: 'Smoke on the Water', artist: 'Deep Purple', tuning: 'Standard', bpm: 112 },
    { title: 'Seven Nation Army', artist: 'The White Stripes', tuning: 'Open A', bpm: 124 },
    { title: 'Back in Black', artist: 'AC/DC', tuning: 'Standard', bpm: 94 },
    { title: 'Enter Sandman', artist: 'Metallica', tuning: 'Standard', bpm: 123 },
    { title: 'Everlong', artist: 'Foo Fighters', tuning: 'Drop D', bpm: 158 },
    { title: 'Black Hole Sun', artist: 'Soundgarden', tuning: 'Drop D', bpm: 105 }
  ]

  const tunings = [
    { value: 'standard', label: 'Standard (E A D G B E)' },
    { value: 'drop-d', label: 'Drop D (D A D G B E)' },
    { value: 'open-g', label: 'Open G (D G D G B D)' },
    { value: 'dadgad', label: 'DADGAD' }
  ]

  const practiceData = [
    { day: 'Mon', minutes: 30 },
    { day: 'Tue', minutes: 45 },
    { day: 'Wed', minutes: 20 },
    { day: 'Thu', minutes: 60 },
    { day: 'Fri', minutes: 35 },
    { day: 'Sat', minutes: 90 },
    { day: 'Sun', minutes: 50 }
  ]

  const chartConfig = {
    minutes: { label: 'Minutes', color: 'var(--chart-1)' }
  } satisfies Chart.ChartConfig

  // --- component state -----------------------------------------------------

  let tempo = $state(120)
  let volume = $state(70)
  let metronome = $state(true)
  let countIn = $state(false)
  let looping = $state(false)
  let tuning = $state('standard')
  let duration = $state('quarter')
  let hand = $state('right')
  let practiceDay = $state(today(getLocalTimeZone()))
  let practiceRange = $state({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 6 })
  })
  let showMixer = $state(false)
  let showMetronome = $state(true)
  let instrument = $state('guitar')

  const tuningLabel = $derived(tunings.find((t) => t.value === tuning)?.label ?? 'Choose a tuning')

  // --- form (superforms in SPA mode, validated with zod) -------------------

  const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Enter a valid email')
  })

  const profileForm = superForm(defaults(zod4(profileSchema)), {
    SPA: true,
    validators: zod4Client(profileSchema),
    onUpdate({ form }) {
      if (form.valid) toast.success(`Saved profile for ${form.data.name}`)
    }
  })
  const { form: profileData, enhance: profileEnhance } = profileForm
</script>

<Sidebar.Provider class="min-h-svh">
  <Sidebar.Root collapsible="icon">
    <!-- macOS: draggable strip that the traffic lights sit in, keeping them clear of the logo. -->
    <div class="titlebar-drag hidden h-10 shrink-0 mac:block"></div>
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg">
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <GuitarIcon class="size-4" />
            </div>
            <span class="font-semibold">Guitar Pro</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Library</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive tooltipContent="Songs">
                <LibraryIcon />
                <span>Songs</span>
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{songs.length}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Setlists">
                <ListMusicIcon />
                <span>Setlists</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Favorites">
                <HeartIcon />
                <span>Favorites</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="Settings">
            <SettingsIcon />
            <span>Settings</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
    <Sidebar.Rail />
  </Sidebar.Root>

  <Sidebar.Inset>
    <!-- App bar: sidebar trigger, menubar, breadcrumb. Doubles as the window's title bar:
         it's draggable, leaves room for the traffic lights when the sidebar is collapsed (macOS),
         and for the overlaid window controls on the right (Windows/Linux). -->
    <header
      class="titlebar-drag sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 win:pr-36 mac:group-has-data-[state=collapsed]/sidebar-wrapper:pl-12"
    >
      <Sidebar.Trigger />
      <Separator orientation="vertical" class="mr-2 h-4 data-vertical:self-center" />
      <Menubar.Root class="border-none shadow-none">
        <Menubar.Menu>
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>New Song <Menubar.Shortcut>⌘N</Menubar.Shortcut></Menubar.Item>
            <Menubar.Item>Open… <Menubar.Shortcut>⌘O</Menubar.Shortcut></Menubar.Item>
            <Menubar.Separator />
            <Menubar.Sub>
              <Menubar.SubTrigger>Export</Menubar.SubTrigger>
              <Menubar.SubContent>
                <Menubar.Item>Guitar Pro (.gp)</Menubar.Item>
                <Menubar.Item>MusicXML</Menubar.Item>
                <Menubar.Item>PDF</Menubar.Item>
              </Menubar.SubContent>
            </Menubar.Sub>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger>View</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.CheckboxItem bind:checked={showMetronome}>Metronome</Menubar.CheckboxItem>
            <Menubar.CheckboxItem bind:checked={showMixer}>Mixer</Menubar.CheckboxItem>
            <Menubar.Separator />
            <Menubar.RadioGroup bind:value={instrument}>
              <Menubar.RadioItem value="guitar">Guitar</Menubar.RadioItem>
              <Menubar.RadioItem value="bass">Bass</Menubar.RadioItem>
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar.Root>
      <Breadcrumb.Root class="ml-auto hidden md:block">
        <Breadcrumb.List>
          <Breadcrumb.Item><Breadcrumb.Link href="#/">Library</Breadcrumb.Link></Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item><Breadcrumb.Ellipsis /></Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item><Breadcrumb.Page>Welcome</Breadcrumb.Page></Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </header>

    <main class="mx-auto w-full max-w-6xl space-y-8 p-6">
      <!-- Hero -->
      <section class="flex flex-col items-center gap-4 py-10 text-center">
        <Avatar.Group>
          <Avatar.Root><Avatar.Fallback><GuitarIcon class="size-4" /></Avatar.Fallback></Avatar.Root>
          <Avatar.Root><Avatar.Fallback><DrumIcon class="size-4" /></Avatar.Fallback></Avatar.Root>
          <Avatar.Root><Avatar.Fallback><MicIcon class="size-4" /></Avatar.Fallback></Avatar.Root>
        </Avatar.Group>
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to Kody's Guitar Pro</h1>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Badge>Svelte 5</Badge>
          <Badge variant="secondary">SvelteKit 3</Badge>
          <Badge variant="outline">Electron</Badge>
        </div>
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger>Get started</NavigationMenu.Trigger>
              <NavigationMenu.Content>
                <ul class="grid w-72 gap-1 p-2">
                  <li>
                    <NavigationMenu.Link href="#/">
                      <div class="font-medium">Open a song</div>
                      <p class="text-sm text-muted-foreground">Load a .gp file from disk.</p>
                    </NavigationMenu.Link>
                  </li>
                  <li>
                    <NavigationMenu.Link href="#/">
                      <div class="font-medium">New score</div>
                      <p class="text-sm text-muted-foreground">Start writing tab from scratch.</p>
                    </NavigationMenu.Link>
                  </li>
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#/">Library</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
      </section>

      <Alert.Root>
        <InfoIcon />
        <Alert.Title>Every shadcn-svelte component, in one place</Alert.Title>
        <Alert.Description>This page is a live tour of the UI kit the app will be built with.</Alert.Description>
      </Alert.Root>

      <!-- Transport -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Transport</Card.Title>
          <Card.Description>Buttons, groups, toggles, sliders, tooltips, keyboard hints.</Card.Description>
          <Card.Action><Spinner /></Card.Action>
        </Card.Header>
        <Card.Content class="flex-row flex-wrap items-center gap-4">
          <ButtonGroup.Root>
            <Tooltip.Root>
              <Tooltip.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
                <PlayIcon />
              </Tooltip.Trigger>
              <Tooltip.Content>Play <Kbd.Root>Space</Kbd.Root></Tooltip.Content>
            </Tooltip.Root>
            <Button variant="outline" size="icon" aria-label="Pause"><PauseIcon /></Button>
            <ButtonGroup.Separator />
            <ButtonGroup.Text>{tempo} BPM</ButtonGroup.Text>
          </ButtonGroup.Root>

          <Toggle aria-label="Loop" bind:pressed={looping}><RepeatIcon /> Loop</Toggle>

          <ToggleGroup.Root type="single" bind:value={duration} variant="outline">
            <ToggleGroup.Item value="whole" aria-label="Whole note">1/1</ToggleGroup.Item>
            <ToggleGroup.Item value="half" aria-label="Half note">1/2</ToggleGroup.Item>
            <ToggleGroup.Item value="quarter" aria-label="Quarter note">1/4</ToggleGroup.Item>
            <ToggleGroup.Item value="eighth" aria-label="Eighth note">1/8</ToggleGroup.Item>
          </ToggleGroup.Root>

          <div class="flex min-w-56 flex-1 items-center gap-3">
            <TimerIcon class="size-4 text-muted-foreground" />
            <Slider type="single" bind:value={tempo} min={40} max={240} step={1} />
          </div>

          <Kbd.Group>
            <Kbd.Root>⌘</Kbd.Root>
            <Kbd.Root>Space</Kbd.Root>
          </Kbd.Group>
        </Card.Content>
        <Card.Footer class="flex flex-col items-stretch gap-2">
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>Bar 12 of 48</span><span>25%</span>
          </div>
          <Progress value={25} />
        </Card.Footer>
      </Card.Root>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Library table + pagination -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Library</Card.Title>
            <Card.Description>Table, pagination, context menu (right-click a row).</Card.Description>
          </Card.Header>
          <Card.Content>
            <Table.Root>
              <Table.Caption>Recently opened songs</Table.Caption>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Song</Table.Head>
                  <Table.Head>Tuning</Table.Head>
                  <Table.Head class="text-right">BPM</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each songs.slice(0, 4) as song (song.title)}
                  <ContextMenu.Root>
                    <ContextMenu.Trigger>
                      {#snippet child({ props })}
                        <Table.Row {...props}>
                          <Table.Cell>
                            <div class="font-medium">{song.title}</div>
                            <div class="text-xs text-muted-foreground">{song.artist}</div>
                          </Table.Cell>
                          <Table.Cell>{song.tuning}</Table.Cell>
                          <Table.Cell class="text-right">{song.bpm}</Table.Cell>
                        </Table.Row>
                      {/snippet}
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                      <ContextMenu.Label>{song.title}</ContextMenu.Label>
                      <ContextMenu.Separator />
                      <ContextMenu.Item>Open <ContextMenu.Shortcut>↵</ContextMenu.Shortcut></ContextMenu.Item>
                      <ContextMenu.Item>Add to setlist</ContextMenu.Item>
                      <ContextMenu.Item variant="destructive">Remove</ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu.Root>
                {/each}
              </Table.Body>
            </Table.Root>
          </Card.Content>
          <Card.Footer>
            <Pagination.Root count={48} perPage={4}>
              {#snippet children({ pages, currentPage })}
                <Pagination.Content>
                  <Pagination.Item><Pagination.Previous /></Pagination.Item>
                  {#each pages as page (page.key)}
                    {#if page.type === 'ellipsis'}
                      <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                    {:else}
                      <Pagination.Item>
                        <Pagination.Link {page} isActive={currentPage === page.value}>
                          {page.value}
                        </Pagination.Link>
                      </Pagination.Item>
                    {/if}
                  {/each}
                  <Pagination.Item><Pagination.Next /></Pagination.Item>
                </Pagination.Content>
              {/snippet}
            </Pagination.Root>
          </Card.Footer>
        </Card.Root>

        <!-- Practice chart -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Practice this week</Card.Title>
            <Card.Description>Chart (minutes per day).</Card.Description>
          </Card.Header>
          <Card.Content>
            <Chart.Container config={chartConfig} class="aspect-auto h-64 w-full">
              <BarChart
                data={practiceData}
                x="day"
                axis="x"
                bandPadding={0.3}
                series={[{ key: 'minutes', label: 'Minutes', color: chartConfig.minutes.color }]}
              >
                {#snippet tooltip()}
                  <Chart.Tooltip />
                {/snippet}
              </BarChart>
            </Chart.Container>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Tabs: settings, form, fields -->
      <Tabs.Root value="setup">
        <Tabs.List>
          <Tabs.Trigger value="setup">Setup</Tabs.Trigger>
          <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
          <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="setup">
          <Card.Root>
            <Card.Header>
              <Card.Title>Instrument setup</Card.Title>
              <Card.Description>Field, select, native select, radio group, switch, checkbox.</Card.Description>
            </Card.Header>
            <Card.Content>
              <Field.Set>
                <Field.Legend>Tuning & playback</Field.Legend>
                <Field.Group>
                  <Field.Field>
                    <Field.Label>Tuning</Field.Label>
                    <Select.Root type="single" bind:value={tuning}>
                      <Select.Trigger class="w-full">{tuningLabel}</Select.Trigger>
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>Tunings</Select.Label>
                          {#each tunings as t (t.value)}
                            <Select.Item value={t.value} label={t.label} />
                          {/each}
                        </Select.Group>
                      </Select.Content>
                    </Select.Root>
                    <Field.Description>Applies to every track in the song.</Field.Description>
                  </Field.Field>
                  <Field.Field>
                    <Field.Label for="capo">Capo</Field.Label>
                    <NativeSelect.Root id="capo">
                      {#each [0, 1, 2, 3, 4, 5, 7] as fret (fret)}
                        <NativeSelect.Option value={fret}>{fret === 0 ? 'No capo' : `Fret ${fret}`}</NativeSelect.Option>
                      {/each}
                    </NativeSelect.Root>
                  </Field.Field>
                  <Field.Separator />
                  <Field.Field>
                    <Field.Label>Picking hand</Field.Label>
                    <RadioGroup.Root bind:value={hand} class="flex gap-6">
                      <div class="flex items-center gap-2">
                        <RadioGroup.Item value="right" id="hand-right" />
                        <Label for="hand-right">Right</Label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioGroup.Item value="left" id="hand-left" />
                        <Label for="hand-left">Left</Label>
                      </div>
                    </RadioGroup.Root>
                  </Field.Field>
                  <Field.Field orientation="horizontal">
                    <Switch id="metronome" bind:checked={metronome} />
                    <Field.Label for="metronome">Metronome</Field.Label>
                  </Field.Field>
                  <Field.Field orientation="horizontal">
                    <Checkbox id="count-in" bind:checked={countIn} />
                    <Field.Content>
                      <Field.Label for="count-in">Count-in</Field.Label>
                      <Field.Description>Play one bar of clicks before starting.</Field.Description>
                    </Field.Content>
                  </Field.Field>
                  <Field.Field>
                    <Field.Label>Volume</Field.Label>
                    <div class="flex items-center gap-3">
                      <Volume2Icon class="size-4 text-muted-foreground" />
                      <Slider type="single" bind:value={volume} max={100} step={1} />
                    </div>
                  </Field.Field>
                </Field.Group>
              </Field.Set>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

        <Tabs.Content value="profile">
          <Card.Root>
            <Card.Header>
              <Card.Title>Profile</Card.Title>
              <Card.Description>Form (superforms + zod), input, OTP input, sonner toast.</Card.Description>
            </Card.Header>
            <Card.Content>
              <form method="POST" use:profileEnhance class="grid max-w-md gap-4">
                <Form.Field form={profileForm} name="name">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label>Name</Form.Label>
                      <Input {...props} bind:value={$profileData.name} placeholder="Kody" />
                    {/snippet}
                  </Form.Control>
                  <Form.Description>Shown on scores you export.</Form.Description>
                  <Form.FieldErrors />
                </Form.Field>
                <Form.Field form={profileForm} name="email">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label>Email</Form.Label>
                      <Input {...props} type="email" bind:value={$profileData.email} />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
                <div class="grid gap-2">
                  <Label>License key</Label>
                  <InputOTP.Root maxlength={6}>
                    {#snippet children({ cells })}
                      <InputOTP.Group>
                        {#each cells.slice(0, 3) as cell (cell)}
                          <InputOTP.Slot {cell} />
                        {/each}
                      </InputOTP.Group>
                      <InputOTP.Separator />
                      <InputOTP.Group>
                        {#each cells.slice(3, 6) as cell (cell)}
                          <InputOTP.Slot {cell} />
                        {/each}
                      </InputOTP.Group>
                    {/snippet}
                  </InputOTP.Root>
                </div>
                <Form.Button class="w-fit">Save profile</Form.Button>
              </form>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

        <Tabs.Content value="notes">
          <Card.Root>
            <Card.Header>
              <Card.Title>Practice notes</Card.Title>
              <Card.Description>Textarea, input group, resizable panes, scroll area.</Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
              <InputGroup.Root>
                <InputGroup.Addon><SearchIcon /></InputGroup.Addon>
                <InputGroup.Input placeholder="Search notes…" />
                <InputGroup.Addon align="inline-end">
                  <InputGroup.Button size="sm">Find</InputGroup.Button>
                </InputGroup.Addon>
              </InputGroup.Root>
              <Resizable.PaneGroup direction="horizontal" class="min-h-48 rounded-lg border">
                <Resizable.Pane defaultSize={40}>
                  <ScrollArea class="h-48 p-3">
                    <div class="space-y-2 text-sm">
                      {#each songs as song (song.title)}
                        <div class="rounded-md px-2 py-1 hover:bg-muted">{song.title}</div>
                      {/each}
                    </div>
                  </ScrollArea>
                </Resizable.Pane>
                <Resizable.Handle withHandle />
                <Resizable.Pane defaultSize={60}>
                  <Textarea class="h-full resize-none border-0 shadow-none focus-visible:ring-0" placeholder="Work on the solo in bar 32 at 80% speed…" />
                </Resizable.Pane>
              </Resizable.PaneGroup>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>
      </Tabs.Root>

      <!-- Overlays -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Overlays</Card.Title>
          <Card.Description>Dialog, alert dialog, sheet, drawer, popover, hover card, dropdown, command, toast.</Card.Description>
        </Card.Header>
        <Card.Content class="flex-row flex-wrap gap-2">
          <Dialog.Root>
            <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Dialog</Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Song properties</Dialog.Title>
                <Dialog.Description>Edit the title and artist.</Dialog.Description>
              </Dialog.Header>
              <div class="grid gap-3">
                <Label for="song-title">Title</Label>
                <Input id="song-title" value="Smoke on the Water" />
              </div>
              <Dialog.Footer>
                <Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
                <Button>Save</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>

          <AlertDialog.Root>
            <AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>Alert dialog</AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Delete this track?</AlertDialog.Title>
                <AlertDialog.Description>This removes the rhythm guitar track from the song.</AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action>Delete</AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>

          <Sheet.Root>
            <Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>Sheet</Sheet.Trigger>
            <Sheet.Content>
              <Sheet.Header>
                <Sheet.Title>Mixer</Sheet.Title>
                <Sheet.Description>Per-track volume.</Sheet.Description>
              </Sheet.Header>
              <div class="grid gap-6 p-4">
                {#each ['Lead', 'Rhythm', 'Bass', 'Drums'] as track (track)}
                  <div class="grid gap-2">
                    <Label>{track}</Label>
                    <Slider type="single" value={70} max={100} />
                  </div>
                {/each}
              </div>
            </Sheet.Content>
          </Sheet.Root>

          <Drawer.Root>
            <Drawer.Trigger class={buttonVariants({ variant: 'outline' })}>Drawer</Drawer.Trigger>
            <Drawer.Content>
              <div class="mx-auto w-full max-w-sm">
                <Drawer.Header>
                  <Drawer.Title>Tempo</Drawer.Title>
                  <Drawer.Description>Slow it down to learn the hard parts.</Drawer.Description>
                </Drawer.Header>
                <div class="p-4 text-center text-5xl font-bold">{tempo}</div>
                <Drawer.Footer>
                  <Drawer.Close class={buttonVariants({ variant: 'outline' })}>Done</Drawer.Close>
                </Drawer.Footer>
              </div>
            </Drawer.Content>
          </Drawer.Root>

          <Popover.Root>
            <Popover.Trigger class={buttonVariants({ variant: 'outline' })}>Popover</Popover.Trigger>
            <Popover.Content>
              <Popover.Header>
                <Popover.Title>Practice day</Popover.Title>
                <Popover.Description>Pick when to practice next.</Popover.Description>
              </Popover.Header>
              <Calendar type="single" bind:value={practiceDay} />
            </Popover.Content>
          </Popover.Root>

          <HoverCard.Root>
            <HoverCard.Trigger class={buttonVariants({ variant: 'link' })}>@deep-purple</HoverCard.Trigger>
            <HoverCard.Content class="w-72">
              <div class="flex gap-3">
                <Avatar.Root><Avatar.Fallback>DP</Avatar.Fallback></Avatar.Root>
                <div class="space-y-1">
                  <h4 class="text-sm font-semibold">Deep Purple</h4>
                  <p class="text-sm text-muted-foreground">English rock band formed in 1968.</p>
                </div>
              </div>
            </HoverCard.Content>
          </HoverCard.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
              Track <ChevronsUpDownIcon />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Label>Track</DropdownMenu.Label>
                <DropdownMenu.Item>Rename</DropdownMenu.Item>
                <DropdownMenu.Item>Duplicate <DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut></DropdownMenu.Item>
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.CheckboxItem bind:checked={metronome}>Metronome</DropdownMenu.CheckboxItem>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <Button variant="outline" onclick={() => toast('Song saved', { description: 'Smoke on the Water.gp' })}>
            Toast
          </Button>
        </Card.Content>
        <Card.Content>
          <Command.Root class="rounded-lg border">
            <Command.Input placeholder="Type a command or search songs…" />
            <Command.List>
              <Command.Empty>No results found.</Command.Empty>
              <Command.Group heading="Songs">
                {#each songs.slice(0, 3) as song (song.title)}
                  <Command.Item><MusicIcon /> {song.title}</Command.Item>
                {/each}
              </Command.Group>
              <Command.Separator />
              <Command.Group heading="Actions">
                <Command.Item><FolderOpenIcon /> Open file… <Command.Shortcut>⌘O</Command.Shortcut></Command.Item>
                <Command.Item><SettingsIcon /> Settings <Command.Shortcut>⌘,</Command.Shortcut></Command.Item>
              </Command.Group>
            </Command.List>
          </Command.Root>
        </Card.Content>
      </Card.Root>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Lists & content -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Setlist</Card.Title>
            <Card.Description>Item, marker, attachment, carousel, aspect ratio.</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <Item.Group>
              {#each songs.slice(0, 2) as song (song.title)}
                <Item.Root variant="outline" size="sm">
                  <Item.Media variant="icon"><MusicIcon /></Item.Media>
                  <Item.Content>
                    <Item.Title>{song.title}</Item.Title>
                    <Item.Description>{song.artist} · {song.bpm} BPM</Item.Description>
                  </Item.Content>
                  <Item.Actions><Button size="sm" variant="ghost"><PlayIcon /></Button></Item.Actions>
                </Item.Root>
              {/each}
            </Item.Group>

            <Marker.Root variant="separator">
              <Marker.Content>Encore</Marker.Content>
            </Marker.Root>

            <Attachment.Group>
              <Attachment.Root>
                <Attachment.Media><FileMusicIcon /></Attachment.Media>
                <Attachment.Content>
                  <Attachment.Title>smoke-on-the-water.gp</Attachment.Title>
                  <Attachment.Description>48 KB</Attachment.Description>
                </Attachment.Content>
              </Attachment.Root>
              <Attachment.Root state="uploading">
                <Attachment.Media><Spinner /></Attachment.Media>
                <Attachment.Content>
                  <Attachment.Title>backing-track.mp3</Attachment.Title>
                  <Attachment.Description>Uploading…</Attachment.Description>
                </Attachment.Content>
              </Attachment.Root>
            </Attachment.Group>

            <Carousel.Root class="mx-12">
              <Carousel.Content>
                {#each songs as song (song.title)}
                  <Carousel.Item class="basis-1/2">
                    <AspectRatio ratio={1} class="flex flex-col items-center justify-center gap-2 rounded-lg bg-muted p-4 text-center">
                      <GuitarIcon class="size-8 text-muted-foreground" />
                      <span class="text-sm font-medium">{song.title}</span>
                    </AspectRatio>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
              <Carousel.Previous />
              <Carousel.Next />
            </Carousel.Root>
          </Card.Content>
        </Card.Root>

        <!-- Chat-style lesson -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Lesson chat</Card.Title>
            <Card.Description>Message, bubble.</Card.Description>
          </Card.Header>
          <Card.Content>
            <Message.Group>
              <Message.Root>
                <Message.Avatar>
                  <Avatar.Root><Avatar.Fallback>T</Avatar.Fallback></Avatar.Root>
                </Message.Avatar>
                <Message.Content>
                  <Message.Header>Teacher</Message.Header>
                  <Bubble.Root variant="muted">
                    <Bubble.Content>Try the riff with palm muting on the low E.</Bubble.Content>
                  </Bubble.Root>
                </Message.Content>
              </Message.Root>
              <Message.Root align="end">
                <Message.Content>
                  <Bubble.Root>
                    <Bubble.Content>Got it, sounds way chunkier now! 🎸</Bubble.Content>
                  </Bubble.Root>
                </Message.Content>
              </Message.Root>
            </Message.Group>
          </Card.Content>
        </Card.Root>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Calendar range -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Practice plan</Card.Title>
            <Card.Description>Range calendar.</Card.Description>
          </Card.Header>
          <Card.Content class="items-center">
            <RangeCalendar bind:value={practiceRange} class="rounded-md border" />
          </Card.Content>
        </Card.Root>

        <!-- FAQ -->
        <Card.Root>
          <Card.Header>
            <Card.Title>FAQ</Card.Title>
            <Card.Description>Accordion, collapsible.</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <Accordion.Root type="single">
              <Accordion.Item value="formats">
                <Accordion.Trigger>Which files can I open?</Accordion.Trigger>
                <Accordion.Content>Guitar Pro 3–8 and MusicXML.</Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="audio">
                <Accordion.Trigger>Does it play audio?</Accordion.Trigger>
                <Accordion.Content>Yes, with a built-in SoundFont synth.</Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
            <Collapsible.Root>
              <Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Keyboard shortcuts <ChevronsUpDownIcon />
              </Collapsible.Trigger>
              <Collapsible.Content class="space-y-2 pt-2 text-sm">
                <div class="flex justify-between"><span>Play / pause</span><Kbd.Root>Space</Kbd.Root></div>
                <div class="flex justify-between"><span>Open file</span><Kbd.Group><Kbd.Root>⌘</Kbd.Root><Kbd.Root>O</Kbd.Root></Kbd.Group></div>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Content>
        </Card.Root>

        <!-- States -->
        <Card.Root>
          <Card.Header>
            <Card.Title>States</Card.Title>
            <Card.Description>Empty, skeleton, destructive alert.</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <Empty.Root class="border border-dashed">
              <Empty.Header>
                <Empty.Media variant="icon"><StarIcon /></Empty.Media>
                <Empty.Title>No favorites yet</Empty.Title>
                <Empty.Description>Star a song to see it here.</Empty.Description>
              </Empty.Header>
              <Empty.Content>
                <Button size="sm" variant="outline"><UploadIcon /> Import songs</Button>
              </Empty.Content>
            </Empty.Root>
            <div class="flex items-center gap-3">
              <Skeleton class="size-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
            <Alert.Root variant="destructive">
              <TriangleAlertIcon />
              <Alert.Title>Audio device not found</Alert.Title>
              <Alert.Description>Plug in your interface and try again.</Alert.Description>
            </Alert.Root>
          </Card.Content>
        </Card.Root>
      </div>

      <footer class="flex items-center justify-center gap-2 pb-6 text-sm text-muted-foreground">
        <AudioLinesIcon class="size-4" /> Built with shadcn-svelte
      </footer>
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
