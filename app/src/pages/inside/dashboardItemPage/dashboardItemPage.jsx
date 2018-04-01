import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import { activeProjectSelector } from 'controllers/user';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { fetch } from 'common/utils';
import styles from './dashboardItemPage.scss';

const cx = classNames.bind(styles);
const ResponsiveGridLayout = WidthProvider(Responsive);

@connect(state => ({
  url: `/api/v1/${activeProjectSelector(state)}/dashboard`,
}))

export class DashboardItemPage extends PureComponent {
  static propTypes = {
    url: PropTypes.string,
    isMobile: PropTypes.bool,
  };

  static defaultProps = {
    url: '',
    isMobile: false,
  };

  state = {
    widgets: [],
  };

  componentDidMount() {
    this.fetchWidgets();
  }

  onBreakpointChange = (newBreakpoint) => {
    this.isMobile = /sm|xs/.test(newBreakpoint);
  }

  onGridChange = (newLayout) => {
    let newWidgets;

    if (this.isMobile) {
      const oldWidgets = this.state.widgets;

      newWidgets = newLayout.map(({ i, y, h }, index) => ({
        widgetId: i,
        widgetPosition: [oldWidgets[index].widgetPosition[0], y],
        widgetSize: [oldWidgets[index].widgetSize[0], h],
      }));
    } else {
      newWidgets = newLayout.map(({ i, x, y, w, h }) => ({
        widgetId: i,
        widgetPosition: [x, y],
        widgetSize: [w, h],
      }));
    }

    this.setState({ widgets: newWidgets });
    this.updateWidgets(newWidgets);
  }

  updateWidgets(widgets) {
    const { dashboardId } = this.props.match.params;

    fetch(`${this.props.url}/${dashboardId}`, {
      method: 'PUT',
      data: {
        updateWidgets: widgets,
      },
    });
  }

  fetchWidgets() {
    return fetch(this.props.url)
      .then((result) => {
        const currentDashboard = result.find(item => (
          item.id === this.props.match.params.dashboardId
        ));

        this.setState({ widgets: currentDashboard.widgets });
      });
  }

  render() {
    const { widgets } = this.state;
    const Items = widgets.map(({ widgetPosition: [x, y], widgetSize: [w, h], widgetId }) => (
      <div key={widgetId} className={cx('gadget-view')} data-grid={{ x, y, w, h }} />
    ));

    return (
      Items.length ?
        <ResponsiveGridLayout
          className={`layout ${cx('dashboard-item')}`}
          rowHeight={30}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          onBreakpointChange={this.onBreakpointChange}
          onDragStop={this.onGridChange}
          onResizeStop={this.onGridChange}
          cols={{ lg: 12, md: 12, sm: 1, xs: 1, xxs: 1 }}
        >
          {Items}
        </ResponsiveGridLayout>
      :
        null
    );
  }
}
