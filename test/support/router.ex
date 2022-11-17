defmodule PhoenixOld.LiveViewTest.Controller do
  use Phoenix.Controller
  import PhoenixOld.LiveView.Controller

  plug :put_layout, false

  def incoming(conn, %{"type" => "live-render-2"}) do
    live_render(conn, PhoenixOld.LiveViewTest.DashboardLive)
  end

  def incoming(conn, %{"type" => "live-render-3"}) do
    live_render(conn, PhoenixOld.LiveViewTest.DashboardLive, session: %{custom: :session})
  end
end

defmodule PhoenixOld.LiveViewTest.Router do
  use Phoenix.Router
  import PhoenixOld.LiveView.Router

  pipeline :browser do
    plug :accepts, ["html"]
  end

  scope "/", PhoenixOld.LiveViewTest do
    pipe_through [:browser]

    # controller test
    get "/controller/:type", Controller, :incoming

    # router test
    live "/router/thermo_defaults/:id", DashboardLive
    live "/router/thermo_session/:id", DashboardLive, session: [:user_id]
    live "/router/thermo_container/:id", DashboardLive, container: {:span, style: "flex-grow"}

    live "/router/thermo_layout/:id", DashboardLive,
      layout: {PhoenixOld.LiveViewTest.AlternativeLayout, :layout}

    # live view test
    live "/thermo", ThermostatLive, session: [:nest, :users, :redir]
    live "/thermo/:id", ThermostatLive, session: [:nest, :users, :redir]

    live "/thermo-container", ThermostatLive,
      session: [:nest],
      container: {:span, style: "thermo-flex<script>"}

    live "/same-child", SameChildLive, session: [:dup]
    live "/root", RootLive, session: [:user_id]
    live "/counter/:id", ParamCounterLive, session: [:test, :test_pid, :on_handle_params]
    live "/opts", OptsLive, session: [:opts]
    live "/time-zones", AppendLive, session: [:time_zones]
    live "/shuffle", ShuffleLive, session: [:time_zones]
    live "/components", WithComponentLive, session: [:names, :from]
  end
end
