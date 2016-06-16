"""
Progress bar encapsulation
"""

# Copyright (c) Timur Iskhakov.
# Distributed under the terms of the MIT License.


import progressbar


class UIProgressBar:
    __widgets = [' ', progressbar.Percentage(), ' ', progressbar.Bar(), ' ', progressbar.ETA()]

    def __init__(self, message):
        """
        :param message: :class:`str` Message to print
        """

        self.message = message
        self.progress_bar = None
        self.value = 0

    def init(self, max_value):
        """Initiates and starts the progress bar.
        :param max_value: :class:`int`, Number of steps for bar
        """

        self.progress_bar = progressbar.ProgressBar(widgets=[self.message] + UIProgressBar.__widgets,
                                                    maxval=max_value)
        self.progress_bar.start()

    def step(self, value=1):
        """Updates the progress bar.
        :param value: Value to increment the process
        """
        self.value += value
        self.progress_bar.update(self.value)

    def finish(self):
        """Finishes the progress bar."""

        self.progress_bar.finish()
        self.value = 0
